/*
 * Display helpers for opportunity cards and pages. Plain functions with no
 * server imports, so client components such as the home strip can use them too.
 */
import type { LocationType, PublicOpportunity } from "./services/opportunities";
import { formatManilaDate, formatManilaTime } from "./opportunity-time";

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

export const PLACE_LABELS: Record<LocationType, string> = {
  onsite: "On site",
  online: "Online",
  hybrid: "Hybrid",
};

/** "On site, PCU Manila, Room 402", or just "Online" when there is no place. */
export function whereLabel(post: Pick<PublicOpportunity, "locationType" | "location">): string {
  const kind = PLACE_LABELS[post.locationType];
  return post.location ? `${kind}, ${post.location}` : kind;
}

/** "Oct 30, 2:00 PM", or "Oct 30" when the time is the end of the day, as date-only input stores it. */
export function dateTimeLabel(date: Date, now: Date = new Date()): string {
  const day = formatManilaDate(date, now);
  const manila = new Date(date.getTime() + MANILA_OFFSET_MS);
  const endOfDay = manila.getUTCHours() === 23 && manila.getUTCMinutes() === 59;
  return endOfDay ? day : `${day}, ${formatManilaTime(date)}`;
}
