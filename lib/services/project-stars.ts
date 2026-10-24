import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { profiles, projects, projectStars, users } from "../db/schema";
import { ServiceError } from "./errors";

/** Adds or removes a student's star. Project owners cannot star their own work. */
export async function setProjectStar(
  db: Db,
  userId: string,
  rawProjectId: string,
  starred: boolean,
): Promise<{ handle: string; starCount: number; starred: boolean }> {
  const projectId = z.uuid().safeParse(rawProjectId);
  if (!projectId.success) throw new ServiceError("NOT_FOUND", "Project not found");

  const [target] = await db
    .select({ projectId: projects.id, ownerId: profiles.userId, handle: profiles.handle })
    .from(projects)
    .innerJoin(profiles, eq(profiles.id, projects.profileId))
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(projects.id, projectId.data), eq(profiles.isHidden, false), isNull(users.deletedAt)));
  if (!target) throw new ServiceError("NOT_FOUND", "Project not found");
  if (target.ownerId === userId) throw new ServiceError("FORBIDDEN", "You cannot star your own project");

  if (starred) {
    await db.insert(projectStars).values({ projectId: target.projectId, userId }).onConflictDoNothing();
  } else {
    await db
      .delete(projectStars)
      .where(and(eq(projectStars.projectId, target.projectId), eq(projectStars.userId, userId)));
  }
  const [count] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(projectStars)
    .where(eq(projectStars.projectId, target.projectId));
  return { handle: target.handle, starCount: count?.value ?? 0, starred };
}

/** Viewer-specific state stays outside cached public profile data. */
export async function starredProjectIds(db: Db, userId: string, projectIds: string[]): Promise<Set<string>> {
  if (projectIds.length === 0) return new Set();
  const rows = await db
    .select({ projectId: projectStars.projectId })
    .from(projectStars)
    .where(and(eq(projectStars.userId, userId), inArray(projectStars.projectId, projectIds)));
  return new Set(rows.map((row) => row.projectId));
}
