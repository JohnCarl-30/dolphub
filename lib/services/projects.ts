import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { images, projects } from "../db/schema";
import type { ServiceContext } from "./context";
import { ServiceError } from "./errors";
import { requireOwnProfile, touchProfile, type Profile } from "./profiles";
import * as v from "./validation";

export type Project = typeof projects.$inferSelect;

const fields = {
  title: v.projectTitle,
  description: v.projectDescription,
  demoUrl: v.optional(v.httpsUrl),
  sourceUrl: v.optional(v.httpsUrl),
  sortOrder: z.number().int().min(0).max(10_000),
};

const createSchema = z.object({
  title: fields.title,
  description: fields.description.optional().default(""),
  demoUrl: fields.demoUrl,
  sourceUrl: fields.sourceUrl,
});
const updateSchema = z.object(fields).partial().strict();

export type CreateProjectInput = z.input<typeof createSchema>;
export type UpdateProjectInput = z.input<typeof updateSchema>;

/** The project, if it belongs to this user. Otherwise NOT_FOUND, so ids are not confirmed to strangers. */
export async function requireOwnProject(
  db: Db,
  userId: string,
  projectId: string,
): Promise<{ project: Project; profile: Profile }> {
  const profile = await requireOwnProfile(db, userId);
  const parsedId = z.uuid().safeParse(projectId);
  const [project] = parsedId.success
    ? await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, parsedId.data), eq(projects.profileId, profile.id)))
    : [];
  if (!project) throw new ServiceError("NOT_FOUND", "Project not found");
  return { project, profile };
}

/** Adds a project at the end of the list. Returns the profile handle so the caller can refresh the page. */
export async function createProject(
  db: Db,
  userId: string,
  input: CreateProjectInput,
): Promise<{ project: Project; handle: string }> {
  const data = v.parse(createSchema, input);
  const profile = await requireOwnProfile(db, userId);
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${projects.sortOrder}) + 1, 0)` })
    .from(projects)
    .where(eq(projects.profileId, profile.id));

  const [project] = await db
    .insert(projects)
    .values({
      profileId: profile.id,
      title: data.title,
      description: data.description,
      demoUrl: data.demoUrl ?? null,
      sourceUrl: data.sourceUrl ?? null,
      sortOrder: Number(next),
    })
    .returning();
  await touchProfile(db, profile.id);
  return { project: project!, handle: profile.handle };
}

export async function updateProject(
  db: Db,
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<{ project: Project; handle: string }> {
  const patch = v.parse(updateSchema, input);
  const { project, profile } = await requireOwnProject(db, userId, projectId);
  const [updated] = await db
    .update(projects)
    .set({ ...patch, updatedAt: sql`now()` })
    .where(eq(projects.id, project.id))
    .returning();
  await touchProfile(db, profile.id);
  return { project: updated!, handle: profile.handle };
}

/**
 * Deletes the project and its images. Database rows go first, so the page
 * stops showing them at once. R2 deletes are best effort, and the orphan
 * sweep removes anything left behind.
 */
export async function deleteProject(
  ctx: ServiceContext,
  userId: string,
  projectId: string,
): Promise<{ handle: string; failedKeys: string[] }> {
  const { project, profile } = await requireOwnProject(ctx.db, userId, projectId);
  const keys = await ctx.db
    .select({ key: images.r2Key })
    .from(images)
    .where(eq(images.projectId, project.id));

  await ctx.db.delete(projects).where(eq(projects.id, project.id));
  await touchProfile(ctx.db, profile.id);

  const failedKeys: string[] = [];
  for (const { key } of keys) {
    try {
      await ctx.storage.delete(key);
    } catch {
      failedKeys.push(key);
    }
  }
  return { handle: profile.handle, failedKeys };
}
