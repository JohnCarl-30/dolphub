import { and, eq, gte, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getServiceContext } from "@/lib/server";
import { profiles, profileViewsDaily, projectClicksDaily, viewSourcesDaily, projects } from "@/lib/db/schema";

export async function DashboardTraffic() {
  const user = await requireUser();
  const db = (await getServiceContext()).db;
  const [profile] = await db.select({ id: profiles.id, searchVisible: profiles.searchVisible }).from(profiles).where(eq(profiles.userId, user.id));
  if (!profile) return null;
  const since = sql`current_date - interval '30 days'`;
  const [views] = await db.select({ views: sql<number>`coalesce(sum(${profileViewsDaily.views}),0)::int`, unique: sql<number>`coalesce(sum(${profileViewsDaily.uniqueVisitors}),0)::int` }).from(profileViewsDaily).where(and(eq(profileViewsDaily.profileId, profile.id), gte(profileViewsDaily.day, since)));
  const sources = await db.select({ source: viewSourcesDaily.source, count: sql<number>`sum(${viewSourcesDaily.count})::int` }).from(viewSourcesDaily).where(and(eq(viewSourcesDaily.profileId, profile.id), gte(viewSourcesDaily.day, since))).groupBy(viewSourcesDaily.source);
  const clicks = await db.select({ title: projects.title, kind: projectClicksDaily.kind, count: sql<number>`sum(${projectClicksDaily.count})::int` }).from(projectClicksDaily).innerJoin(projects, eq(projects.id, projectClicksDaily.projectId)).where(and(eq(projects.profileId, profile.id), gte(projectClicksDaily.day, since))).groupBy(projects.title, projectClicksDaily.kind);
  const totalViews = Number(views?.views ?? 0);
  return <section aria-label="Portfolio analytics" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <article className="border border-ink/10 bg-background p-4"><p className="font-mono text-[10px] uppercase tracking-wide text-muted">/views · 30 days</p><p className="mt-2 text-3xl font-medium">{totalViews}</p><p className="text-xs text-muted">~{Number(views?.unique ?? 0)} estimated visitors</p></article>
    <article className="border border-ink/10 bg-background p-4"><p className="font-mono text-[10px] uppercase tracking-wide text-muted">/sources · 30 days</p>{sources.length ? sources.map((row) => <div key={row.source} className="mt-2 flex justify-between gap-3 text-sm"><span>{row.source}</span><span>{row.count}</span></div>) : <p className="mt-2 text-sm text-muted">No visits yet.</p>}</article>
    <article className="border border-ink/10 bg-background p-4"><p className="font-mono text-[10px] uppercase tracking-wide text-muted">/project clicks · 30 days</p>{clicks.length ? clicks.map((row) => <div key={`${row.title}-${row.kind}`} className="mt-2 flex justify-between gap-3 text-sm"><span className="truncate">{row.title} · {row.kind}</span><span>{row.count}</span></div>) : <p className="mt-2 text-sm text-muted">No clicks yet.</p>}{profile.searchVisible ? <p className="mt-3 border-t border-ink/10 pt-3 text-xs text-muted">Search appearances will appear when Dolphub adds profile search.</p> : null}</article>
    <p className="sm:col-span-2 lg:col-span-3 font-mono text-[10px] uppercase tracking-wide text-muted">Milestones · {totalViews >= 100 ? "100 profile views" : totalViews >= 10 ? "10 profile views" : "Your first 10 views are on the way"}</p>
  </section>;
}
