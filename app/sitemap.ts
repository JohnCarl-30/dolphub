import type { MetadataRoute } from "next";
import { getOpenOpportunities } from "@/lib/opportunities";
import { OPPORTUNITY_PAGES_LIVE, opportunitySitemapEntries, siteUrl } from "@/lib/seo";
import { listIndexableProfiles } from "@/lib/seo-data";

/** Home, plus real student pages that allow search engines. Dates come from the data, never from new Date(). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const profiles = await listIndexableProfiles();
  // Reading opportunities makes the sitemap per-request, so it is off until the pages exist.
  const opportunities = OPPORTUNITY_PAGES_LIVE
    ? opportunitySitemapEntries(origin, await getOpenOpportunities())
    : [];
  return [
    { url: `${origin}/`, changeFrequency: "daily", priority: 1 },
    ...profiles.map((p) => ({
      url: `${origin}/u/${p.handle}`,
      ...(p.updatedAt ? { lastModified: p.updatedAt } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...opportunities,
  ];
}
