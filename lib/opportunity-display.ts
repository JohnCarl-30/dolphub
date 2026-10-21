/*
 * Display helpers for opportunity cards and pages. Plain functions with no
 * server imports, so client components such as the home strip can use them too.
 */
import type { LocationType, OpportunityKind, PublicOpportunity } from "./services/opportunities";
import { formatManilaDate, formatManilaTime, isEndOfManilaDay } from "./opportunity-time";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Display names, kept in step with KIND_LABELS in lib/services/opportunities.ts (a server module). */
export const KIND_NAMES: Record<OpportunityKind, string> = {
  internship: "Internship",
  event: "Event",
  competition: "Competition",
  program: "Program",
};

/** The call to action a post's button should use. */
export function actionLabel(kind: OpportunityKind): string {
  return kind === "event" || kind === "competition" ? "Register" : "Apply";
}

/** Open posts, soonest closing first, the same rule as listOpenOpportunities. */
export function upcomingOpportunities(
  posts: PublicOpportunity[],
  now: Date,
  limit = 3,
): PublicOpportunity[] {
  return posts
    .filter((item) => item.closesAt.getTime() > now.getTime())
    .sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime())
    .slice(0, limit);
}

/** The window in which an open post is urgent enough for the home page's focus band. */
export const FOCUS_WINDOW_DAYS = 3;

/** The soonest-closing open post that closes within the focus window, or null. */
export function focusOpportunity(posts: PublicOpportunity[], now: Date): PublicOpportunity | null {
  const [first] = upcomingOpportunities(posts, now, 1);
  if (!first) return null;
  return first.closesAt.getTime() - now.getTime() <= FOCUS_WINDOW_DAYS * DAY_MS ? first : null;
}

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
  return isEndOfManilaDay(date) ? day : `${day}, ${formatManilaTime(date)}`;
}
