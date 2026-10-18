/*
 * Mock content for the home page's upcoming strip, focus band and newsletter.
 * Shapes match the real backend (`PublicOpportunity`) so the UI can switch to
 * `getOpenOpportunities()` later without changing components. Dates are made
 * relative to "now" so the strip always has something open and something closing soon.
 */
import type { OpportunityKind, PublicOpportunity } from "./services/opportunities";
import { closesAtFor } from "./opportunity-time";

const DAY_MS = 24 * 60 * 60 * 1000;
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** Display names, kept in step with KIND_LABELS in lib/services/opportunities.ts (a server module). */
export const KIND_NAMES: Record<OpportunityKind, string> = {
  internship: "Internship",
  event: "Event",
  competition: "Competition",
  program: "Program",
};

/** A Manila wall-clock time `days` from `now`, e.g. at(now, 2, 14) is 2 pm two days from today. */
function at(now: Date, days: number, hour: number, minute = 0): Date {
  const manilaNow = new Date(now.getTime() + MANILA_OFFSET_MS);
  const utc = Date.UTC(
    manilaNow.getUTCFullYear(),
    manilaNow.getUTCMonth(),
    manilaNow.getUTCDate() + days,
    hour,
    minute,
  );
  return new Date(utc - MANILA_OFFSET_MS);
}

type Draft = Omit<PublicOpportunity, "closesAt" | "createdAt" | "updatedAt">;

function post(now: Date, draft: Draft): PublicOpportunity {
  const created = new Date(now.getTime() - 5 * DAY_MS);
  return {
    ...draft,
    closesAt: closesAtFor(draft) ?? at(now, 0, 23, 59),
    createdAt: created,
    updatedAt: created,
  };
}

/** Eight sample posts across all four kinds, including one that already closed. */
export function mockOpportunities(now: Date = new Date()): PublicOpportunity[] {
  return [
    post(now, {
      slug: "pcu-cs-society-hack-night-q8m2",
      kind: "event",
      title: "Hack Night: build a campus tool in one evening",
      organization: "PCU Computer Science Society",
      summary: "Teams of three build something small for PCU students. Pizza at 6, demos at 10.",
      url: "https://example.com/pcu-hack-night",
      locationType: "onsite",
      location: "PCU Manila, Room 402",
      startsAt: at(now, 0, 18),
      endsAt: at(now, 0, 22),
      deadline: null,
    }),
    post(now, {
      slug: "globe-software-intern-k3f9",
      kind: "internship",
      title: "Software Engineering Intern, Summer 2027",
      organization: "Globe Telecom",
      summary: "Twelve weeks on an internal tools team. Open to third and fourth year IT and CS students.",
      url: "https://example.com/globe-intern",
      locationType: "hybrid",
      location: "Taguig",
      startsAt: null,
      endsAt: null,
      deadline: at(now, 1, 23, 59),
    }),
    post(now, {
      slug: "dict-cyber-cup-p2x7",
      kind: "competition",
      title: "Cyber Cup capture-the-flag, college division",
      organization: "DICT Region NCR",
      summary: "A one-day CTF for teams of four. Beginner and open brackets.",
      url: "https://example.com/cyber-cup",
      locationType: "online",
      location: null,
      startsAt: at(now, 9, 9),
      endsAt: at(now, 9, 17),
      deadline: at(now, 3, 23, 59),
    }),
    post(now, {
      slug: "aws-cloud-clubs-workshop-t5n1",
      kind: "event",
      title: "Deploy your first app on the cloud",
      organization: "AWS Cloud Club PCU",
      summary: "A hands-on workshop. Bring a laptop and a project you want online.",
      url: "https://example.com/aws-workshop",
      locationType: "onsite",
      location: "PCU Manila, Computer Lab 3",
      startsAt: at(now, 6, 13),
      endsAt: at(now, 6, 16),
      deadline: null,
    }),
    post(now, {
      slug: "google-dev-scholarship-r4c8",
      kind: "program",
      title: "Developer Scholarship, 2027 cohort",
      organization: "Google Developer Groups Manila",
      summary: "Six months of mentoring and certification vouchers for 30 students.",
      url: "https://example.com/gdg-scholarship",
      locationType: "online",
      location: null,
      startsAt: null,
      endsAt: null,
      deadline: at(now, 14, 23, 59),
    }),
    post(now, {
      slug: "accenture-ojt-batch-3-h7w2",
      kind: "internship",
      title: "OJT, Technology Analyst track",
      organization: "Accenture Philippines",
      summary: "A 486-hour OJT placement with a project team. Requires an endorsement letter from PCU.",
      url: "https://example.com/accenture-ojt",
      locationType: "onsite",
      location: "Mandaluyong",
      startsAt: null,
      endsAt: null,
      deadline: at(now, 21, 23, 59),
    }),
    post(now, {
      slug: "ph-startup-week-demo-day-b9d3",
      kind: "event",
      title: "Startup Week demo day",
      organization: "QBO Innovation Hub",
      summary: "Watch ten student teams pitch, then meet the founders.",
      url: "https://example.com/demo-day",
      locationType: "hybrid",
      location: "Makati",
      startsAt: at(now, 28, 15),
      endsAt: at(now, 28, 19),
      deadline: null,
    }),
    // Already closed: proves the strip filters it out.
    post(now, {
      slug: "past-ui-design-jam-z1z1",
      kind: "competition",
      title: "UI design jam",
      organization: "PCU IT Society",
      summary: "A finished event, kept to test that closed posts never show.",
      url: "https://example.com/design-jam",
      locationType: "onsite",
      location: "PCU Manila",
      startsAt: at(now, -3, 9),
      endsAt: at(now, -3, 17),
      deadline: null,
    }),
  ];
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

/** The window in which an open post is urgent enough for the focus band. */
export const FOCUS_WINDOW_DAYS = 3;

/** The soonest-closing open post that closes within the focus window, or null. */
export function focusOpportunity(posts: PublicOpportunity[], now: Date): PublicOpportunity | null {
  const [first] = upcomingOpportunities(posts, now, 1);
  if (!first) return null;
  return first.closesAt.getTime() - now.getTime() <= FOCUS_WINDOW_DAYS * DAY_MS ? first : null;
}

/** The call to action a post's button should use. */
export function actionLabel(kind: OpportunityKind): string {
  return kind === "event" || kind === "competition" ? "Register" : "Apply";
}

export const NEWSLETTER_TOPICS: { id: OpportunityKind; label: string }[] = [
  { id: "internship", label: "Internships" },
  { id: "event", label: "Events" },
  { id: "competition", label: "Competitions" },
  { id: "program", label: "Programs" },
];
