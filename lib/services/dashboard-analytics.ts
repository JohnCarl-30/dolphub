import { and, desc, eq, gte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Db } from "../db";
import { opportunities, profilePictures, profiles, projectStars, projects, users } from "../db/schema";
import type { Dashboard } from "./dashboard";

const DAY = 86_400_000;
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export function fillDailyBuckets(rows: { day: string | Date; count: number }[], days = 30, now = new Date()) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const counts = new Map(rows.map((row) => [typeof row.day === "string" ? row.day.slice(0, 10) : dayKey(row.day), Number(row.count)]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getTime() - (days - index - 1) * DAY);
    const key = dayKey(date);
    return { day: key, count: counts.get(key) ?? 0 };
  });
}

export function getProfileStrength(dashboard: Dashboard) {
  const p = dashboard.profile;
  if (!p) return { score: 0, missing: [] as { label: string; href: string }[] };
  const checks = [
    { label: "Add a profile picture", href: "/profile", done: Boolean(p.profilePicture) },
    { label: "Add a tagline", href: "/profile", done: Boolean(p.tagline.trim()) },
    { label: "Choose your course", href: "/profile", done: Boolean(dashboard.courses.find((course) => course.id === p.courseId)) },
    { label: "Add your GitHub", href: "/profile", done: Boolean(p.githubUsername) },
    { label: "Add a contact link", href: "/profile", done: Boolean(p.messengerUrl || p.contactEmail) },
    { label: "Add a project", href: "/profile/projects", done: dashboard.projects.length > 0 },
    { label: "Describe every project", href: "/profile/projects", done: dashboard.projects.every((project) => Boolean(project.description.trim())) },
    { label: "Add a photo to every project", href: "/profile/projects", done: dashboard.projects.every((project) => project.images.length > 0) },
    { label: "Show your page in search", href: "/profile", done: p.searchVisible },
  ];
  const missing = checks.filter((check) => !check.done).map(({ label, href }) => ({ label, href }));
  return { score: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };
}

export async function getStarStats(db: Db, userId: string, days = 30, now = new Date()) {
  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(projectStars)
    .innerJoin(projects, eq(projects.id, projectStars.projectId))
    .innerJoin(profiles, eq(profiles.id, projects.profileId)).where(eq(profiles.userId, userId));
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY);
  const rows = await db.select({ day: sql<string>`date_trunc('day', ${projectStars.createdAt})::date::text`, count: sql<number>`count(*)::int` })
    .from(projectStars).innerJoin(projects, eq(projects.id, projectStars.projectId))
    .innerJoin(profiles, eq(profiles.id, projects.profileId))
    .where(and(eq(profiles.userId, userId), gte(projectStars.createdAt, new Date(now.getTime() - days * DAY))))
    .groupBy(sql`date_trunc('day', ${projectStars.createdAt})`);
  const [periods] = await db.select({
    thisWeek: sql<number>`count(*) filter (where ${projectStars.createdAt} >= ${sevenDaysAgo})::int`,
    lastWeek: sql<number>`count(*) filter (where ${projectStars.createdAt} >= ${fourteenDaysAgo} and ${projectStars.createdAt} < ${sevenDaysAgo})::int`,
  }).from(projectStars).innerJoin(projects, eq(projects.id, projectStars.projectId))
    .innerJoin(profiles, eq(profiles.id, projects.profileId)).where(eq(profiles.userId, userId));
  return { total: Number(total?.count ?? 0), thisWeek: Number(periods?.thisWeek ?? 0), lastWeek: Number(periods?.lastWeek ?? 0), change: Number(periods?.thisWeek ?? 0) - Number(periods?.lastWeek ?? 0), daily: fillDailyBuckets(rows, days, now) };
}

export async function getRecentActivity(db: Db, userId: string, limit = 10) {
  const ownerUser = alias(users, "owner_user");
  const starrerUser = alias(users, "starrer_user");
  const starrer = alias(profiles, "starrer_profile");
  const rows = await db.select({ name: starrer.displayName, handle: starrer.handle, avatar: profilePictures.r2Key, hidden: starrer.isHidden, title: projects.title, createdAt: projectStars.createdAt })
    .from(projectStars).innerJoin(projects, eq(projects.id, projectStars.projectId))
    .innerJoin(profiles, eq(profiles.id, projects.profileId)).innerJoin(ownerUser, eq(ownerUser.id, profiles.userId))
    .leftJoin(starrerUser, eq(starrerUser.id, projectStars.userId)).leftJoin(starrer, eq(starrer.userId, starrerUser.id))
    .leftJoin(profilePictures, eq(profilePictures.profileId, starrer.id))
    .where(eq(profiles.userId, userId)).orderBy(desc(projectStars.createdAt)).limit(limit);
  return rows.map((row) => ({ starrerName: !row.hidden && row.name ? row.name : "Someone", starrerHandle: !row.hidden ? row.handle : null, starrerAvatar: !row.hidden && row.avatar ? row.avatar : null, projectTitle: row.title, createdAt: row.createdAt }));
}

export async function getTopProject(db: Db, userId: string) {
  const rows = await db.select({ id: projects.id, title: projects.title, stars: sql<number>`count(${projectStars.userId})::int` })
    .from(projects).innerJoin(profiles, eq(profiles.id, projects.profileId))
    .leftJoin(projectStars, eq(projectStars.projectId, projects.id)).where(eq(profiles.userId, userId))
    .groupBy(projects.id).orderBy(desc(sql`count(${projectStars.userId})`), desc(projects.createdAt));
  const total = rows.reduce((sum, row) => sum + Number(row.stars), 0);
  const top = rows[0];
  return top ? { ...top, share: total ? Math.round((Number(top.stars) / total) * 100) : 0 } : null;
}

export async function getNewOpportunities(db: Db, since: Date, limit = 3) {
  const rows = await db.select().from(opportunities).where(and(eq(opportunities.isHidden, false), gte(opportunities.createdAt, since), gte(opportunities.closesAt, new Date())))
    .orderBy(desc(opportunities.createdAt)).limit(limit);
  return rows;
}
