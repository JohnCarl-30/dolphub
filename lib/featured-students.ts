import type { ShowcaseCard } from "./showcase-data";

/**
 * Public portfolio handles to feature on the landing page, in display order.
 * Add a handle here when a student has agreed to be featured.
 */
export const FEATURED_STUDENT_HANDLES: readonly string[] = [];

/**
 * Returns only currently published showcase cards for configured handles.
 * The showcase loader already omits hidden and unpublished portfolios.
 */
export function selectFeaturedStudents(handles: readonly string[], cards: ShowcaseCard[]): ShowcaseCard[] {
  const byHandle = new Map(cards.map((card) => [card.handle.toLowerCase(), card]));
  const seen = new Set<string>();

  return handles.flatMap((configuredHandle) => {
    const handle = configuredHandle.trim().toLowerCase();
    if (!handle || seen.has(handle)) return [];
    seen.add(handle);
    const card = byHandle.get(handle);
    return card ? [card] : [];
  });
}

export function featuredStudents(cards: ShowcaseCard[]): ShowcaseCard[] {
  return selectFeaturedStudents(FEATURED_STUDENT_HANDLES, cards);
}
