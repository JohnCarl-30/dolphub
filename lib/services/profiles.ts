import { and, asc, desc, eq, exists, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { courses, images, profilePictures, profiles, projects, users } from "../db/schema";
import type { ServiceContext } from "./context";
import { ServiceError, isUniqueViolation } from "./errors";
import { validateHandle } from "./handles";
import * as v from "./validation";

export type Profile = typeof profiles.$inferSelect;

const createSchema = z.object({
  handle: z.string(),
  displayName: v.displayName,
  courseId: z.coerce.number<unknown>().int().positive("Choose your course"),
  tagline: v.tagline.optional().default(""),
  messengerUrl: v.optional(v.messengerUrl),
  githubUsername: v.optional(v.githubUsername),
  contactEmail: v.optional(v.contactEmail),
});

const updateSchema = z
  .object({
    displayName: v.displayName,
    courseId: z.coerce.number<unknown>().int().positive("Choose your course"),
    tagline: v.tagline,
    messengerUrl: v.optional(v.messengerUrl),
    githubUsername: v.optional(v.githubUsername),
    contactEmail: v.optional(v.contactEmail),
    coverImageId: z.uuid().nullable(),
    searchVisible: z.boolean(),
  })
  .partial()
  .strict();

export type CreateProfileInput = z.input<typeof createSchema>;
export type UpdateProfileInput = z.input<typeof updateSchema>;

export async function listActiveCourses(db: Db) {
  return db
    .select({ id: courses.id, name: courses.name })
    .from(courses)
    .where(eq(courses.active, true))
    .orderBy(asc(courses.name));
}

async function requireActiveCourse(db: Db, courseId: number) {
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.active, true)));
  if (!course) {
    throw new ServiceError(
      "VALIDATION",
      "Your program isn't supported yet. This site is for PCU tech programs for now.",
      "courseId",
    );
  }
}

export async function getProfileByUserId(db: Db, userId: string): Promise<Profile | null> {
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return row ?? null;
}

/** The signed-in user's own profile, or NOT_FOUND. */
export async function requireOwnProfile(db: Db, userId: string): Promise<Profile> {
  const profile = await getProfileByUserId(db, userId);
  if (!profile) throw new ServiceError("NOT_FOUND", "Create your profile first");
  return profile;
}

/** Marks the profile changed, which also changes its preview image version. */
export async function touchProfile(db: Db, profileId: string): Promise<void> {
  await db.update(profiles).set({ updatedAt: sql`now()` }).where(eq(profiles.id, profileId));
}

export async function isHandleAvailable(db: Db, rawHandle: string): Promise<boolean> {
  const handle = validateHandle(rawHandle);
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.handle, handle));
  return !row;
}

/** Creates the user's one profile. The handle cannot be changed afterwards. */
export async function createProfile(
  db: Db,
  userId: string,
  input: CreateProfileInput,
): Promise<Profile> {
  const data = v.parse(createSchema, input);
  const handle = validateHandle(data.handle);
  if (await getProfileByUserId(db, userId)) {
    throw new ServiceError("CONFLICT", "You already have a profile");
  }
  await requireActiveCourse(db, data.courseId);

  try {
    const [created] = await db
      .insert(profiles)
      .values({
        userId,
        handle,
        displayName: data.displayName,
        courseId: data.courseId,
        tagline: data.tagline,
        messengerUrl: data.messengerUrl ?? null,
        githubUsername: data.githubUsername ?? null,
        contactEmail: data.contactEmail ?? null,
      })
      .returning();
    return created!;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ServiceError("CONFLICT", "That handle is already taken", "handle");
    }
    throw error;
  }
}

/** Updates editable fields. Handle is not editable. */
export async function updateProfile(
  db: Db,
  userId: string,
  input: UpdateProfileInput,
): Promise<Profile> {
  const patch = v.parse(updateSchema, input);
  const profile = await requireOwnProfile(db, userId);

  if (patch.courseId !== undefined) await requireActiveCourse(db, patch.courseId);
  if (patch.coverImageId) {
    const [image] = await db
      .select({ id: images.id })
      .from(images)
      .where(and(eq(images.id, patch.coverImageId), eq(images.profileId, profile.id)));
    if (!image) throw new ServiceError("VALIDATION", "Pick one of your own images", "coverImageId");
  }

  const [updated] = await db
    .update(profiles)
    .set({ ...patch, updatedAt: sql`now()` })
    .where(eq(profiles.id, profile.id))
    .returning();
  return updated!;
}

export interface PublicImage {
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface PublicProject {
  id: string;
  title: string;
  description: string;
  demoUrl: string | null;
  sourceUrl: string | null;
  images: PublicImage[];
}

export interface PublicProfile {
  handle: string;
  displayName: string;
  tagline: string;
  courseName: string;
  messengerUrl: string | null;
  githubUsername: string | null;
  /** Shown to anyone who opens the page. Keep it out of structured data, previews and logs. */
  contactEmail: string | null;
  /** Optional public portrait. It is separate from project images and page covers. */
  profilePicture: PublicImage | null;
  coverImage: PublicImage | null;
  projects: PublicProject[];
  /** False when the student opted out of search engines. Pages then get noindex. */
  searchVisible: boolean;
  /** Use as a version stamp on preview image URLs. */
  updatedAt: Date;
}

/** Visible profiles only: not hidden, and the owner is not being deleted. */
const visible = and(eq(profiles.isHidden, false), isNull(users.deletedAt));

/** What /u/<handle> shows. Null when missing, hidden, or being deleted. */
export async function getPublicProfile(
  ctx: ServiceContext,
  rawHandle: string,
): Promise<PublicProfile | null> {
  const handle = rawHandle.trim().toLowerCase();
  const [row] = await ctx.db
    .select({ profile: profiles, courseName: courses.name })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .innerJoin(courses, eq(courses.id, profiles.courseId))
    .where(and(eq(profiles.handle, handle), visible));
  if (!row) return null;
  const { profile } = row;

  const [projectRows, imageRows, pictureRows] = await Promise.all([
    ctx.db
      .select()
      .from(projects)
      .where(eq(projects.profileId, profile.id))
      .orderBy(asc(projects.sortOrder), asc(projects.createdAt)),
    ctx.db
      .select()
      .from(images)
      .where(eq(images.profileId, profile.id))
      .orderBy(asc(images.sortOrder), asc(images.createdAt)),
    ctx.db
      .select()
      .from(profilePictures)
      .where(eq(profilePictures.profileId, profile.id)),
  ]);

  const toPublic = (i: typeof images.$inferSelect): PublicImage => ({
    id: i.id,
    url: ctx.storage.publicUrl(i.r2Key),
    width: i.width,
    height: i.height,
  });

  const publicProjects = projectRows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    demoUrl: p.demoUrl,
    sourceUrl: p.sourceUrl,
    images: imageRows.filter((i) => i.projectId === p.id).map(toPublic),
  }));

  const chosen = imageRows.find((i) => i.id === profile.coverImageId);
  const coverImage = chosen
    ? toPublic(chosen)
    : (publicProjects.find((p) => p.images.length > 0)?.images[0] ?? null);
  const picture = pictureRows[0];

  return {
    handle: profile.handle,
    displayName: profile.displayName,
    tagline: profile.tagline,
    courseName: row.courseName,
    messengerUrl: profile.messengerUrl,
    githubUsername: profile.githubUsername,
    contactEmail: profile.contactEmail,
    profilePicture: picture
      ? {
          id: picture.id,
          url: ctx.storage.publicUrl(picture.r2Key),
          width: picture.width,
          height: picture.height,
        }
      : null,
    coverImage,
    projects: publicProjects,
    searchVisible: profile.searchVisible,
    updatedAt: profile.updatedAt,
  };
}

export interface GridCard {
  id: string;
  handle: string;
  displayName: string;
  tagline: string;
  courseName: string;
  coverImageUrl: string | null;
  /** The first project in the student's order, shown on the card. */
  featuredProject: { title: string; description: string };
  createdAt: Date;
}

export interface GridCursor {
  createdAt: Date;
  id: string;
}

/**
 * Home grid: visible profiles with at least one project, newest first.
 * Pass the last card's createdAt and id as `after` to get the next page.
 */
export async function listGridProfiles(
  ctx: ServiceContext,
  options: { limit?: number; after?: GridCursor } = {},
): Promise<GridCard[]> {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 100);
  const hasProject = exists(
    ctx.db.select({ one: sql`1` }).from(projects).where(eq(projects.profileId, profiles.id)),
  );
  const page = options.after
    ? or(
        lt(profiles.createdAt, options.after.createdAt),
        and(eq(profiles.createdAt, options.after.createdAt), lt(profiles.id, options.after.id)),
      )
    : undefined;

  const rows = await ctx.db
    .select({ profile: profiles, courseName: courses.name })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .innerJoin(courses, eq(courses.id, profiles.courseId))
    .where(and(visible, hasProject, page))
    .orderBy(desc(profiles.createdAt), desc(profiles.id))
    .limit(limit);
  if (rows.length === 0) return [];

  // Cover fallback order matches getPublicProfile: chosen cover, else first project's first image.
  const ids = rows.map((r) => r.profile.id);
  const imageRows = await ctx.db
    .select({
      id: images.id,
      profileId: images.profileId,
      r2Key: images.r2Key,
    })
    .from(images)
    .innerJoin(projects, eq(projects.id, images.projectId))
    .where(inArray(images.profileId, ids))
    .orderBy(
      asc(projects.sortOrder),
      asc(projects.createdAt),
      asc(images.sortOrder),
      asc(images.createdAt),
    );

  const projectRows = await ctx.db
    .select({ profileId: projects.profileId, title: projects.title, description: projects.description })
    .from(projects)
    .where(inArray(projects.profileId, ids))
    .orderBy(asc(projects.sortOrder), asc(projects.createdAt));

  return rows.map(({ profile, courseName }) => {
    // Every grid profile has a project, because the query requires one.
    const featured = projectRows.find((p) => p.profileId === profile.id)!;
    const mine = imageRows.filter((i) => i.profileId === profile.id);
    const cover = mine.find((i) => i.id === profile.coverImageId) ?? mine[0];
    return {
      id: profile.id,
      handle: profile.handle,
      displayName: profile.displayName,
      tagline: profile.tagline,
      courseName,
      coverImageUrl: cover ? ctx.storage.publicUrl(cover.r2Key) : null,
      featuredProject: { title: featured.title, description: featured.description },
      createdAt: profile.createdAt,
    };
  });
}

/** Pages search engines may list: visible, and the student left "show in search engines" on. */
export async function listIndexableProfiles(
  ctx: ServiceContext,
): Promise<{ handle: string; updatedAt: Date }[]> {
  return ctx.db
    .select({ handle: profiles.handle, updatedAt: profiles.updatedAt })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(visible, eq(profiles.searchVisible, true)))
    .orderBy(asc(profiles.handle));
}
