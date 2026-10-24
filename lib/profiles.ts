import "server-only";
import { cacheTag } from "next/cache";
import { connection } from "next/server";
import { FEATURED_PROJECTS_TAG, GRID_TAG, profileTag } from "./cache-tags";
import { courseLabel } from "./course-labels";
import { getServiceContext } from "./server";
import { getPublicProfile, listActiveCourses, listFeaturedProjects, listGridProfiles, type FeaturedProject, type PublicProfile } from "./services/profiles";
import { isMissingRelation } from "./services/errors";
import { logError } from "./log";
import type { Showcase } from "./showcase-data";

/*
 * Loaders for the student pages and the signed-in `/home` showcase. Call them inside a
 * <Suspense> boundary.
 *
 * Each one waits for the request (connection()), so nothing reaches the
 * database at build time, then reads a cached copy. Students' saves and the
 * admin's hide switch expire the cache through profileTag and GRID_TAG, so
 * visitors rarely wait on a Neon cold start.
 */

async function cachedProfile(handle: string): Promise<PublicProfile | null> {
  "use cache";
  cacheTag(profileTag(handle));
  return getPublicProfile(await getServiceContext(), handle);
}

/** Everything /u/<handle> shows. Null when missing, hidden, or being deleted: call notFound() then. */
export async function getProfilePage(handle: string): Promise<PublicProfile | null> {
  await connection();
  const normalizedHandle = handle.trim().toLowerCase();
  try {
    return await cachedProfile(normalizedHandle);
  } catch (error) {
    if (!isMissingRelation(error, "project_stars")) throw error;
    logError("Public profile stars unavailable", error);
    return getPublicProfile(await getServiceContext(), normalizedHandle, { includeStars: false });
  }
}

/** The 100-card ceiling is far above the semester target of 50 pages. Add paging before it matters. */
const SHOWCASE_LIMIT = 100;

async function cachedShowcase(): Promise<Showcase> {
  "use cache";
  cacheTag(GRID_TAG);
  const ctx = await getServiceContext();
  const [cards, courses] = await Promise.all([
    listGridProfiles(ctx, { limit: SHOWCASE_LIMIT }),
    listActiveCourses(ctx.db),
  ]);
  return {
    cards: cards.map((card) => ({
      handle: card.handle,
      displayName: card.displayName,
      tagline: card.tagline,
      courseName: card.courseName,
      coverImageUrl: card.coverImageUrl,
      featuredProject: card.featuredProject,
    })),
    courses: courses.map((course) => ({ name: course.name, label: courseLabel(course.name) })),
  };
}

/** Published student pages for the signed-in `/home` showcase, newest first, with the course filter options. */
export async function getShowcase(): Promise<Showcase> {
  await connection();
  return cachedShowcase();
}

export interface FeaturedProjectsResult {
  projects: FeaturedProject[];
  starsAvailable: boolean;
}

async function cachedFeaturedProjects(): Promise<FeaturedProjectsResult> {
  "use cache";
  cacheTag(FEATURED_PROJECTS_TAG);
  return { projects: await listFeaturedProjects(await getServiceContext()), starsAvailable: true };
}

/** The public landing's top projects. Ranking changes when a project is starred. */
export async function getFeaturedProjects(): Promise<FeaturedProjectsResult> {
  await connection();
  try {
    return await cachedFeaturedProjects();
  } catch (error) {
    if (!isMissingRelation(error, "project_stars")) throw error;
    logError("Featured project stars unavailable", error);
    return {
      projects: await listFeaturedProjects(await getServiceContext(), 3, { includeStars: false }),
      starsAvailable: false,
    };
  }
}
