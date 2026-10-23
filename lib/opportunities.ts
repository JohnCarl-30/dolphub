import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { requireUser } from "./auth";
import { OPPORTUNITIES_TAG } from "./cache-tags";
import type { OpportunityPreview } from "./opportunity-display";
import { getServiceContext } from "./server";
import {
  getOpportunity,
  listOpenOpportunities,
  listOpportunitiesForAdmin,
  OPPORTUNITY_KINDS,
  type AdminOpportunity,
  type OpportunityKind,
  type PublicOpportunity,
} from "./services/opportunities";

/*
 * Loaders for the opportunity pages. Call them inside a <Suspense> boundary.
 *
 * Each one waits for the request (connection()), so nothing reaches the
 * database at build time, then reads a cached copy that admin writes expire
 * and that refreshes hourly. Whether a post has closed is decided per request,
 * so a post leaves the list the moment it closes, not up to an hour later.
 */

function toKind(kind: string | null | undefined): OpportunityKind | undefined {
  return OPPORTUNITY_KINDS.find((k) => k === kind);
}

async function cachedOpen(kind: OpportunityKind | undefined): Promise<PublicOpportunity[]> {
  "use cache";
  cacheTag(OPPORTUNITIES_TAG);
  cacheLife("hours");
  return listOpenOpportunities(await getServiceContext(), { kind, limit: 200 });
}

/** Open posts, soonest closing first. Pass a kind from a tab or ?kind=, or nothing for all. Unknown kinds mean all. */
export async function getOpenOpportunities(kind?: string | null): Promise<PublicOpportunity[]> {
  await connection();
  const now = Date.now();
  return (await cachedOpen(toKind(kind))).filter((o) => o.closesAt.getTime() > now);
}

async function cachedBySlug(slug: string) {
  "use cache";
  cacheTag(OPPORTUNITIES_TAG);
  cacheLife("hours");
  return getOpportunity(await getServiceContext(), slug);
}

/** The same open posts without the organization's link, for client components on public pages such as the home page. */
export async function getOpenOpportunityPreviews(): Promise<OpportunityPreview[]> {
  return (await getOpenOpportunities()).map((post) => {
    const preview: OpportunityPreview & { url?: string } = { ...post };
    delete preview.url;
    return preview;
  });
}

/**
 * One post for /opportunities/<slug>, including closed ones so shared links still work.
 * Null when it does not exist or an admin hid it: call notFound() then.
 */
export async function getOpportunityPage(
  slug: string,
): Promise<(PublicOpportunity & { isClosed: boolean }) | null> {
  await connection();
  const opportunity = await cachedBySlug(slug.trim().toLowerCase());
  return opportunity ? { ...opportunity, isClosed: opportunity.closesAt.getTime() <= Date.now() } : null;
}

/** Every post for the admin page, including hidden and closed ones. Admins only. Not cached. */
export async function getAdminOpportunities(): Promise<AdminOpportunity[]> {
  const user = await requireUser();
  return listOpportunitiesForAdmin(await getServiceContext(), user.id);
}
