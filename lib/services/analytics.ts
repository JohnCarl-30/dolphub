import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../db";
import { analyticsDedupe, profiles, profileViewsDaily, projectClicksDaily, profileLinkClicksDaily, projects, viewSourcesDaily } from "../db/schema";

export type ViewSource = "showcase" | "search" | "share" | "external" | "direct";
export function classifyViewSource(ref: string | null, referrer: string | null, origin: string): ViewSource {
  if (ref === "showcase" || ref === "search" || ref === "share") return ref;
  if (!referrer) return "direct";
  try { return new URL(referrer).origin === origin ? "direct" : "external"; } catch { return "direct"; }
}

export async function recordProfileView(db: Db, handle: string, ownerUserId: string | null, visitorKey: string, source: ViewSource, now = new Date()) {
  const [profile] = await db.select({ id: profiles.id, userId: profiles.userId }).from(profiles)
    .where(and(eq(profiles.handle, handle), eq(profiles.isHidden, false)));
  if (!profile || profile.userId === ownerUserId) return false;
  const day = now.toISOString().slice(0, 10);
  const inserted = await db.insert(analyticsDedupe).values({ visitorKey, profileId: profile.id, day, expiresAt: new Date(now.getTime() + 36 * 60 * 60 * 1000) }).onConflictDoNothing().returning();
  if (!inserted.length) return false;
  await db.insert(profileViewsDaily).values({ profileId: profile.id, day, views: 1, uniqueVisitors: 1 })
    .onConflictDoUpdate({ target: [profileViewsDaily.profileId, profileViewsDaily.day], set: { views: sql`${profileViewsDaily.views} + 1`, uniqueVisitors: sql`${profileViewsDaily.uniqueVisitors} + 1` } });
  await db.insert(viewSourcesDaily).values({ profileId: profile.id, day, source, count: 1 })
    .onConflictDoUpdate({ target: [viewSourcesDaily.profileId, viewSourcesDaily.day, viewSourcesDaily.source], set: { count: sql`${viewSourcesDaily.count} + 1` } });
  return true;
}

export async function recordProjectClick(db: Db, projectId: string, kind: "demo" | "source", ownerUserId: string | null, now = new Date()) {
  const [project] = await db.select({ id: projects.id, owner: profiles.userId }).from(projects).innerJoin(profiles, eq(profiles.id, projects.profileId))
    .where(and(eq(projects.id, projectId), eq(profiles.isHidden, false)));
  if (!project || project.owner === ownerUserId) return false;
  const day = now.toISOString().slice(0, 10);
  await db.insert(projectClicksDaily).values({ projectId, day, kind, count: 1 }).onConflictDoUpdate({ target: [projectClicksDaily.projectId, projectClicksDaily.day, projectClicksDaily.kind], set: { count: sql`${projectClicksDaily.count} + 1` } });
  return true;
}

export async function recordProfileLinkClick(db: Db, handle: string, kind: "github" | "messenger" | "email", ownerUserId: string | null, now = new Date()) {
  const [profile] = await db.select({ id: profiles.id, owner: profiles.userId }).from(profiles).where(and(eq(profiles.handle, handle), eq(profiles.isHidden, false)));
  if (!profile || profile.owner === ownerUserId) return false;
  const day = now.toISOString().slice(0, 10);
  await db.insert(profileLinkClicksDaily).values({ profileId: profile.id, day, kind, count: 1 }).onConflictDoUpdate({ target: [profileLinkClicksDaily.profileId, profileLinkClicksDaily.day, profileLinkClicksDaily.kind], set: { count: sql`${profileLinkClicksDaily.count} + 1` } });
  return true;
}
