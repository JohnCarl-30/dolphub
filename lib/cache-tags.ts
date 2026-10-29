/**
 * Cache tags shared by the public pages, which tag their cached data,
 * and the actions and routes that change it, which expire the tags.
 */
export const GRID_TAG = "grid";
export const FEATURED_PROJECTS_TAG = "featured-projects";

export function dashboardStatsTag(userId: string): string {
  return `dashboard-stats:${userId}`;
}

export function profileTag(handle: string): string {
  return `profile:${handle.toLowerCase()}`;
}

/** Every opportunity list and page. Admin writes expire it. */
export const OPPORTUNITIES_TAG = "opportunities";
