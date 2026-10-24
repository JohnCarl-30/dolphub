import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, type TestEnv } from "../test/helpers";
import {
  addProjectImage,
  deleteImage,
  deleteProfilePicture,
  IMAGE_LIMITS,
  processImage,
  setProfilePicture,
  sweepOrphanedImages,
} from "./images";
import { createProfile, getPublicProfile, updateProfile } from "./profiles";
import { createProject, deleteProject } from "./projects";

const smallJpeg = () =>
  sharp({ create: { width: 64, height: 48, channels: 3, background: "#3366cc" } }).jpeg().toBuffer();

/** Random noise compresses badly, so it stresses the 500 KB cap. */
const noisyJpeg = (size: number) =>
  sharp(randomBytes(size * size * 3), { raw: { width: size, height: size, channels: 3 } })
    .jpeg({ quality: 90 })
    .toBuffer();

describe("processImage", () => {
  it("re-encodes to WebP under 500 KB, even for a hard image", async () => {
    const input = await noisyJpeg(1400);
    expect(input.byteLength).toBeGreaterThan(IMAGE_LIMITS.maxStoredBytes);
    const out = await processImage(input);
    expect(out.bytes.byteLength).toBeLessThanOrEqual(IMAGE_LIMITS.maxStoredBytes);
    expect((await sharp(out.bytes).metadata()).format).toBe("webp");
  });

  it("strips metadata such as camera EXIF and applies rotation", async () => {
    const input = await sharp({ create: { width: 80, height: 40, channels: 3, background: "#fff" } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .withExifMerge({ IFD0: { Make: "TestCam" } })
      .toBuffer();
    const inputMeta = await sharp(input).metadata();
    expect(inputMeta.orientation).toBe(6);
    expect(inputMeta.exif).toBeDefined();
    const out = await processImage(input);
    const meta = await sharp(out.bytes).metadata();
    expect(meta.exif).toBeUndefined();
    expect([out.width, out.height]).toEqual([40, 80]);
  });

  it("rejects non-images, unsupported formats and oversize uploads", async () => {
    await expect(processImage(new TextEncoder().encode("hello"))).rejects.toMatchObject({ code: "VALIDATION" });
    const gif = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#000" } }).gif().toBuffer();
    await expect(processImage(gif)).rejects.toThrow(/JPEG, PNG or WebP/);
    await expect(processImage(new Uint8Array(IMAGE_LIMITS.maxUploadBytes + 1))).rejects.toThrow(/under 4 MB/);
  });
});

describe("project images", () => {
  let env: TestEnv;
  let userId: string;
  let projectId: string;

  beforeEach(async () => {
    env = await createTestContext();
    userId = (await env.createUser()).id;
    await createProfile(env.db, userId, { handle: "maria", displayName: "Maria", courseId: env.courseId });
    projectId = (await createProject(env.db, userId, { title: "Site" })).project.id;
  });

  it("stores the image in R2 and shows it as the page cover", async () => {
    const { image } = await addProjectImage(env.ctx, userId, projectId, await smallJpeg());
    expect(env.storage.objects.size).toBe(1);
    const [key] = env.storage.objects.keys();
    expect(key).toMatch(/^profiles\/[0-9a-f-]+\/[0-9a-f-]+\.webp$/);
    const page = await getPublicProfile(env.ctx, "maria");
    expect(page?.coverImage?.id).toBe(image.id);
    expect(page?.projects[0]?.images).toHaveLength(1);
  });

  it("enforces 10 images per student across projects", async () => {
    const second = (await createProject(env.db, userId, { title: "Two" })).project.id;
    const img = await smallJpeg();
    for (let i = 0; i < IMAGE_LIMITS.maxImagesPerProfile; i++) {
      await addProjectImage(env.ctx, userId, i % 2 ? second : projectId, img);
    }
    await expect(addProjectImage(env.ctx, userId, projectId, img)).rejects.toMatchObject({
      code: "LIMIT_REACHED",
    });
    expect(env.storage.objects.size).toBe(IMAGE_LIMITS.maxImagesPerProfile);
  });

  it("deletes the object with the image, and clears the cover choice", async () => {
    const { image } = await addProjectImage(env.ctx, userId, projectId, await smallJpeg());
    await updateProfile(env.db, userId, { coverImageId: image.id });
    await deleteImage(env.ctx, userId, image.id);
    expect(env.storage.objects.size).toBe(0);
    expect((await getPublicProfile(env.ctx, "maria"))?.coverImage).toBeNull();
  });

  it("does not let another user delete or attach images", async () => {
    const { image } = await addProjectImage(env.ctx, userId, projectId, await smallJpeg());
    const other = await env.createUser();
    await createProfile(env.db, other.id, { handle: "other", displayName: "O", courseId: env.courseId });
    await expect(deleteImage(env.ctx, other.id, image.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addProjectImage(env.ctx, other.id, projectId, await smallJpeg())).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(updateProfile(env.db, other.id, { coverImageId: image.id })).rejects.toMatchObject({
      field: "coverImageId",
    });
  });

  it("removes project images from R2 when the project is deleted", async () => {
    await addProjectImage(env.ctx, userId, projectId, await smallJpeg());
    await deleteProject(env.ctx, userId, projectId);
    expect(env.storage.objects.size).toBe(0);
  });

  it("sweeps only old objects that have no database row", async () => {
    await addProjectImage(env.ctx, userId, projectId, await smallJpeg());
    await setProfilePicture(env.ctx, userId, await smallJpeg());
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await env.storage.put("profiles/x/orphan-old.webp", new Uint8Array([1]), "image/webp");
    env.storage.objects.get("profiles/x/orphan-old.webp")!.lastModified = old;
    await env.storage.put("profiles/x/orphan-new.webp", new Uint8Array([1]), "image/webp");
    for (const o of env.storage.objects.values()) if (o.lastModified !== old) o.lastModified = old;
    env.storage.objects.get("profiles/x/orphan-new.webp")!.lastModified = new Date();

    const result = await sweepOrphanedImages(env.ctx);
    expect(result.deleted).toEqual(["profiles/x/orphan-old.webp"]);
    expect(env.storage.objects.size).toBe(3);
  });
});

describe("profile pictures", () => {
  let env: TestEnv;
  let userId: string;

  beforeEach(async () => {
    env = await createTestContext();
    userId = (await env.createUser()).id;
    await createProfile(env.db, userId, { handle: "ava", displayName: "Ava", courseId: env.courseId });
  });

  it("stores one portrait separately from project-image capacity and shows it publicly", async () => {
    const image = await setProfilePicture(env.ctx, userId, await smallJpeg());
    const page = await getPublicProfile(env.ctx, "ava");
    expect(image.image.url).toMatch(/profile-picture-.+\.webp$/);
    expect(page?.profilePicture).toMatchObject({ id: image.image.id, width: 64, height: 48 });
    expect(env.storage.objects.size).toBe(1);
  });

  it("replaces and removes the portrait without leaving stored objects behind", async () => {
    const first = await setProfilePicture(env.ctx, userId, await smallJpeg());
    const second = await setProfilePicture(env.ctx, userId, await smallJpeg());
    expect(first.image.id).toBe(second.image.id);
    expect(env.storage.objects.size).toBe(1);
    expect((await deleteProfilePicture(env.ctx, userId)).failedKeys).toEqual([]);
    expect((await getPublicProfile(env.ctx, "ava"))?.profilePicture).toBeNull();
    expect(env.storage.objects.size).toBe(0);
  });

  it("does not let another student replace or remove a portrait", async () => {
    await setProfilePicture(env.ctx, userId, await smallJpeg());
    const other = await env.createUser();
    await createProfile(env.db, other.id, { handle: "other-avatar", displayName: "Other", courseId: env.courseId });
    await expect(setProfilePicture(env.ctx, other.id, await smallJpeg())).resolves.toMatchObject({ handle: "other-avatar" });
    await expect(deleteProfilePicture(env.ctx, other.id)).resolves.toMatchObject({ handle: "other-avatar" });
    expect((await getPublicProfile(env.ctx, "ava"))?.profilePicture).not.toBeNull();
  });
});
