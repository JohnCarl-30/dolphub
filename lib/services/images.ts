import { randomUUID } from "node:crypto";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import sharp from "sharp";
import { z } from "zod";
import { images, profilePictures } from "../db/schema";
import { nowOf, type ServiceContext } from "./context";
import { ServiceError } from "./errors";
import { requireOwnProfile, touchProfile, type PublicImage } from "./profiles";
import { requireOwnProject } from "./projects";

export const IMAGE_LIMITS = {
  /** Per student, across all projects. */
  maxImagesPerProfile: 10,
  /** Size of the stored file after re-encoding. */
  maxStoredBytes: 500 * 1024,
  /** Raw upload size. Vercel rejects request bodies over 4.5 MB, so stay under it. */
  maxUploadBytes: 4 * 1024 * 1024,
  /** Rejects decompression bombs, such as a tiny file that expands to a huge canvas. */
  maxInputPixels: 50_000_000,
};

const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);
const SIZES = [1600, 1280, 1024, 800];
const QUALITIES = [80, 70, 60, 50];

export interface ProcessedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  contentType: "image/webp";
}

/**
 * Validates and re-encodes an upload as WebP of at most 500 KB.
 * Re-encoding drops all metadata, including phone GPS location, and
 * applies the camera's rotation so photos are not sideways.
 */
export async function processImage(input: Uint8Array): Promise<ProcessedImage> {
  if (input.byteLength > IMAGE_LIMITS.maxUploadBytes) {
    throw new ServiceError("VALIDATION", "Image is too large. Upload a file under 4 MB.", "image");
  }
  const options = { limitInputPixels: IMAGE_LIMITS.maxInputPixels };

  let format: string | undefined;
  try {
    format = (await sharp(input, options).metadata()).format;
  } catch {
    throw new ServiceError("VALIDATION", "That file is not an image we can read.", "image");
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) {
    throw new ServiceError("VALIDATION", "Upload a JPEG, PNG or WebP image.", "image");
  }

  for (const size of SIZES) {
    for (const quality of QUALITIES) {
      const { data, info } = await sharp(input, options)
        .autoOrient()
        .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
        .webp({ quality })
        .toBuffer({ resolveWithObject: true });
      if (data.byteLength <= IMAGE_LIMITS.maxStoredBytes) {
        return {
          bytes: new Uint8Array(data),
          width: info.width,
          height: info.height,
          contentType: "image/webp",
        };
      }
    }
  }
  throw new ServiceError(
    "VALIDATION",
    "This image is too detailed to fit in 500 KB. Try a smaller or simpler image.",
    "image",
  );
}

async function countProfileImages(ctx: ServiceContext, profileId: string): Promise<number> {
  const [row] = await ctx.db
    .select({ n: count() })
    .from(images)
    .where(eq(images.profileId, profileId));
  return Number(row?.n ?? 0);
}

/**
 * Adds an image to one of the user's projects.
 * Order: re-encode, upload to R2, then insert the row. If the insert fails,
 * or a parallel upload pushed the student over the cap, the object is removed.
 */
export async function addProjectImage(
  ctx: ServiceContext,
  userId: string,
  projectId: string,
  data: Uint8Array,
): Promise<{ image: PublicImage; handle: string }> {
  const { project, profile } = await requireOwnProject(ctx.db, userId, projectId);
  const limitError = () =>
    new ServiceError(
      "LIMIT_REACHED",
      `You can have up to ${IMAGE_LIMITS.maxImagesPerProfile} images. Delete one to add another.`,
      "image",
    );
  if ((await countProfileImages(ctx, profile.id)) >= IMAGE_LIMITS.maxImagesPerProfile) {
    throw limitError();
  }

  const processed = await processImage(data);
  const key = `profiles/${profile.id}/${randomUUID()}.webp`;
  await ctx.storage.put(key, processed.bytes, processed.contentType);

  let imageId: string;
  try {
    const [{ n }] = await ctx.db
      .select({ n: count() })
      .from(images)
      .where(eq(images.projectId, project.id));
    const [row] = await ctx.db
      .insert(images)
      .values({
        projectId: project.id,
        profileId: profile.id,
        r2Key: key,
        width: processed.width,
        height: processed.height,
        bytes: processed.bytes.byteLength,
        sortOrder: Number(n),
      })
      .returning({ id: images.id });
    imageId = row!.id;
  } catch (error) {
    await ctx.storage.delete(key).catch(() => undefined);
    throw error;
  }

  if ((await countProfileImages(ctx, profile.id)) > IMAGE_LIMITS.maxImagesPerProfile) {
    await ctx.db.delete(images).where(eq(images.id, imageId));
    await ctx.storage.delete(key).catch(() => undefined);
    throw limitError();
  }

  await touchProfile(ctx.db, profile.id);
  return {
    image: {
      id: imageId,
      url: ctx.storage.publicUrl(key),
      width: processed.width,
      height: processed.height,
    },
    handle: profile.handle,
  };
}

/**
 * Replaces the signed-in student's optional public profile picture.
 * The portrait is deliberately separate from the ten project-image limit.
 */
export async function setProfilePicture(
  ctx: ServiceContext,
  userId: string,
  data: Uint8Array,
): Promise<{ image: PublicImage; handle: string }> {
  const profile = await requireOwnProfile(ctx.db, userId);
  const processed = await processImage(data);
  const key = `profiles/${profile.id}/profile-picture-${randomUUID()}.webp`;
  await ctx.storage.put(key, processed.bytes, processed.contentType);

  let previousKey: string | null = null;
  let pictureId: string;
  try {
    const [previous] = await ctx.db
      .select({ r2Key: profilePictures.r2Key })
      .from(profilePictures)
      .where(eq(profilePictures.profileId, profile.id));
    previousKey = previous?.r2Key ?? null;
    const [picture] = await ctx.db
      .insert(profilePictures)
      .values({
        profileId: profile.id,
        r2Key: key,
        width: processed.width,
        height: processed.height,
        bytes: processed.bytes.byteLength,
      })
      .onConflictDoUpdate({
        target: profilePictures.profileId,
        set: {
          r2Key: key,
          width: processed.width,
          height: processed.height,
          bytes: processed.bytes.byteLength,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: profilePictures.id });
    pictureId = picture!.id;
    await touchProfile(ctx.db, profile.id);
  } catch (error) {
    await ctx.storage.delete(key).catch(() => undefined);
    throw error;
  }

  if (previousKey && previousKey !== key) await ctx.storage.delete(previousKey).catch(() => undefined);
  return {
    image: {
      id: pictureId,
      url: ctx.storage.publicUrl(key),
      width: processed.width,
      height: processed.height,
    },
    handle: profile.handle,
  };
}

/** Removes one of the user's images. The row goes first, then the R2 object, best effort. */
export async function deleteImage(
  ctx: ServiceContext,
  userId: string,
  imageId: string,
): Promise<{ handle: string; failedKeys: string[] }> {
  const profile = await requireOwnProfile(ctx.db, userId);
  const parsedId = z.uuid().safeParse(imageId);
  const [image] = parsedId.success
    ? await ctx.db
        .select()
        .from(images)
        .where(and(eq(images.id, parsedId.data), eq(images.profileId, profile.id)))
    : [];
  if (!image) throw new ServiceError("NOT_FOUND", "Image not found");

  await ctx.db.delete(images).where(eq(images.id, image.id));
  await touchProfile(ctx.db, profile.id);
  try {
    await ctx.storage.delete(image.r2Key);
    return { handle: profile.handle, failedKeys: [] };
  } catch {
    return { handle: profile.handle, failedKeys: [image.r2Key] };
  }
}

/** Removes the signed-in student's profile picture without touching project images. */
export async function deleteProfilePicture(
  ctx: ServiceContext,
  userId: string,
): Promise<{ handle: string; failedKeys: string[] }> {
  const profile = await requireOwnProfile(ctx.db, userId);
  const [picture] = await ctx.db
    .select()
    .from(profilePictures)
    .where(eq(profilePictures.profileId, profile.id));
  if (!picture) throw new ServiceError("NOT_FOUND", "Profile picture not found");

  await ctx.db.delete(profilePictures).where(eq(profilePictures.id, picture.id));
  await touchProfile(ctx.db, profile.id);
  try {
    await ctx.storage.delete(picture.r2Key);
    return { handle: profile.handle, failedKeys: [] };
  } catch {
    return { handle: profile.handle, failedKeys: [picture.r2Key] };
  }
}

/**
 * Nightly cleanup: deletes R2 objects with no database row.
 * Objects younger than `minAgeMs` are skipped, because an upload in progress
 * writes to R2 a moment before its row exists.
 */
export async function sweepOrphanedImages(
  ctx: ServiceContext,
  options: { minAgeMs?: number } = {},
): Promise<{ deleted: string[]; failed: string[] }> {
  const minAgeMs = options.minAgeMs ?? 60 * 60 * 1000;
  const cutoff = nowOf(ctx).getTime() - minAgeMs;
  const stored = (await ctx.storage.list("profiles/")).filter(
    (o) => o.lastModified.getTime() < cutoff,
  );
  if (stored.length === 0) return { deleted: [], failed: [] };

  const known = new Set<string>();
  const keys = stored.map((o) => o.key);
  for (let i = 0; i < keys.length; i += 500) {
    const slice = keys.slice(i, i + 500);
    const [projectRows, pictureRows] = await Promise.all([
      ctx.db.select({ key: images.r2Key }).from(images).where(inArray(images.r2Key, slice)),
      ctx.db.select({ key: profilePictures.r2Key }).from(profilePictures).where(inArray(profilePictures.r2Key, slice)),
    ]);
    for (const r of [...projectRows, ...pictureRows]) known.add(r.key);
  }

  const deleted: string[] = [];
  const failed: string[] = [];
  for (const key of keys) {
    if (known.has(key)) continue;
    try {
      await ctx.storage.delete(key);
      deleted.push(key);
    } catch {
      failed.push(key);
    }
  }
  return { deleted, failed };
}

/** Image keys for one profile, for account deletion. */
export async function listProfileImageKeys(ctx: ServiceContext, profileId: string) {
  const [projectRows, pictureRows] = await Promise.all([
    ctx.db.select({ key: images.r2Key }).from(images).where(eq(images.profileId, profileId)),
    ctx.db.select({ key: profilePictures.r2Key }).from(profilePictures).where(eq(profilePictures.profileId, profileId)),
  ]);
  return [...projectRows, ...pictureRows].map((r) => r.key);
}
