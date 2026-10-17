import "server-only";
import { cacheTag } from "next/cache";
import { GRID_TAG, profileTag } from "./cache-tags";
import { courseName, getPublicProfile, INITIAL_PROFILES } from "./mock-profiles";
import type { SeoProfile } from "./seo";

/*
 * The one place where search metadata, share images and the sitemap get
 * profile data. Today it reads the frontend's sample data, the same data the
 * page shows, and marks it "mock" so it is never indexed.
 *
 * When pages switch to the database, change only this file: call
 * getPublicProfile(await getServiceContext(), handle) from lib/services, map
 * coverImage, updatedAt and searchVisible, set source "real", and list real
 * indexable profiles below. The dashboard actions already expire both tags.
 */

export async function getSeoProfile(handle: string): Promise<SeoProfile | null> {
  "use cache";
  cacheTag(profileTag(handle));
  const profile = getPublicProfile(INITIAL_PROFILES, handle);
  if (!profile) return null;
  return {
    handle: profile.handle,
    displayName: profile.displayName,
    tagline: profile.tagline,
    courseName: courseName(profile.courseId),
    coverImageUrl: null,
    updatedAt: null,
    source: "mock",
    searchVisible: true,
  };
}

/** Profiles for the sitemap. Empty while every page is sample data. */
export async function listIndexableProfiles(): Promise<{ handle: string; updatedAt: string | null }[]> {
  "use cache";
  cacheTag(GRID_TAG);
  return [];
}
