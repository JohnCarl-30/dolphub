/**
 * Cache tags shared by the public pages, which tag their cached data,
 * and the actions and routes that change it, which expire the tags.
 */
export const GRID_TAG = "grid";

export function profileTag(handle: string): string {
  return `profile:${handle.toLowerCase()}`;
}
