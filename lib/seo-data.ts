import "server-only";
import { connection } from "next/server";
import { getProfilePage } from "./profiles";
import type { SeoProfile } from "./seo";
import { getServiceContext } from "./server";
import { listIndexableProfiles as listIndexable } from "./services/profiles";

/*
 * The one place where search metadata, share images and the sitemap get
 * profile data. It reads the same cached copy the page shows.
 */

export async function getSeoProfile(handle: string): Promise<SeoProfile | null> {
  const profile = await getProfilePage(handle);
  if (!profile) return null;
  return {
    handle: profile.handle,
    displayName: profile.displayName,
    tagline: profile.tagline,
    courseName: profile.courseName,
    coverImageUrl: profile.coverImage?.url ?? null,
    updatedAt: profile.updatedAt.toISOString(),
    source: "real",
    searchVisible: profile.searchVisible,
  };
}

/** Profiles for the sitemap: visible pages whose students allow search engines. */
export async function listIndexableProfiles(): Promise<{ handle: string; updatedAt: string | null }[]> {
  await connection();
  const rows = await listIndexable(await getServiceContext());
  return rows.map((row) => ({ handle: row.handle, updatedAt: row.updatedAt.toISOString() }));
}
