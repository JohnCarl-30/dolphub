import type { Metadata } from "next";
import { formatManilaDate } from "./opportunity-time";

/*
 * Search and sharing metadata for Dolphub. Pure functions with no Next.js
 * runtime imports, so they run in tests and at build time.
 */

export const DEFAULT_SITE_URL = "https://dolphub.tech";

/**
 * The site's public origin, from APP_URL when it is a valid http(s) URL.
 * Never calls loadConfig, which throws at build time without every env var.
 * Not VERCEL_URL, which would put preview hostnames into canonical links.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.APP_URL?.trim();
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
    } catch {
      // fall through to the default
    }
  }
  return DEFAULT_SITE_URL;
}

export const SITE = {
  name: "Dolphub",
  title: "Dolphub · Portfolio pages for PCU tech students",
  description:
    "Dolphub gives every PCU IT, Computer Science and Computer Engineering student one link to show their projects.",
  locale: "en_PH",
  colors: { background: "#ffffff", ink: "#0e1012", muted: "#60636a", paper: "#f5f5f3" },
} as const;

/** Repeat these in every page's openGraph: Next merges metadata shallowly, so a page's openGraph replaces the root one. */
export const OG_DEFAULTS = { siteName: SITE.name, locale: SITE.locale, type: "website" } as const;

/** For pages that must never appear in search results. */
export const PRIVATE_ROBOTS = { index: false, follow: false } as const;

/** What metadata needs about a student page, from mock data today and the database later. */
export interface SeoProfile {
  handle: string;
  displayName: string;
  tagline: string;
  courseName: string;
  /** Absolute URL of the cover photo, if any. */
  coverImageUrl: string | null;
  /** ISO timestamp of the last change, if known. */
  updatedAt: string | null;
  /** Sample data must never be indexed. */
  source: "mock" | "real";
  /** The student's own "show in search engines" setting. */
  searchVisible: boolean;
}

/**
 * Only real students who have not opted out. Hidden or deleted profiles
 * never reach this point, because the lookup returns null for them.
 */
export function isIndexable(profile: SeoProfile): boolean {
  return profile.source === "real" && profile.searchVisible;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const atSpace = cut.lastIndexOf(" ");
  return `${(atSpace > max * 0.6 ? cut.slice(0, atSpace) : cut).replace(/[\s,.;:]+$/, "")}…`;
}

/** One or two sentences for search results and link previews, at most 160 characters. */
export function profileDescription(profile: SeoProfile): string {
  const who = `${profile.displayName}, ${profile.courseName} at PCU.`;
  const tagline = profile.tagline.trim();
  return truncate(tagline ? `${who} ${tagline}` : `${who} See their projects on Dolphub.`, 160);
}

export function profilePath(handle: string): string {
  return `/u/${handle.toLowerCase()}`;
}

export function profileMetadata(profile: SeoProfile): Metadata {
  const description = profileDescription(profile);
  const url = profilePath(profile.handle);
  return {
    title: profile.displayName,
    description,
    alternates: { canonical: url },
    ...(isIndexable(profile) ? {} : { robots: PRIVATE_ROBOTS }),
    openGraph: {
      ...OG_DEFAULTS,
      type: "profile",
      title: profile.displayName,
      description,
      url,
      username: profile.handle,
    },
    twitter: { card: "summary_large_image", title: profile.displayName, description },
  };
}

export function missingProfileMetadata(): Metadata {
  return { title: "Page not found", robots: PRIVATE_ROBOTS };
}

type JsonLd = Record<string, unknown>;

export function websiteJsonLd(origin: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: `${origin}/`,
    description: SITE.description,
    inLanguage: "en",
  };
}

export function profilePageJsonLd(profile: SeoProfile, origin: string): JsonLd {
  const url = `${origin}${profilePath(profile.handle)}`;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    ...(profile.updatedAt ? { dateModified: profile.updatedAt } : {}),
    mainEntity: {
      "@type": "Person",
      name: profile.displayName,
      alternateName: profile.handle,
      description: profileDescription(profile),
      url,
      ...(profile.coverImageUrl ? { image: profile.coverImageUrl } : {}),
    },
  };
}

/** JSON for a script tag. Escapes "<" so student-written text cannot close the tag. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ---------------------------------------------------------------------------
// Opportunities

/**
 * Turn on when the /opportunities pages are live, so the sitemap lists them.
 * Until then the sitemap would point search engines at pages that 404.
 */
export const OPPORTUNITY_PAGES_LIVE = true;

/** What metadata needs about an opportunity. Matches PublicOpportunity from lib/services. */
export interface SeoOpportunity {
  slug: string;
  kind: "internship" | "event" | "competition" | "program";
  title: string;
  organization: string;
  summary: string;
  locationType: "onsite" | "online" | "hybrid";
  location: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  closesAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KIND_NAMES: Record<SeoOpportunity["kind"], string> = {
  internship: "Internship",
  event: "Event",
  competition: "Competition",
  program: "Program",
};

export const OPPORTUNITIES_PATH = "/opportunities";

export function opportunityPath(slug: string): string {
  return `${OPPORTUNITIES_PATH}/${slug}`;
}

export const OPPORTUNITIES_DESCRIPTION =
  "Open internships, events, competitions and programs for PCU IT, Computer Science and Computer Engineering students.";

/** For the /opportunities list page. */
export function opportunitiesListMetadata(): Metadata {
  return {
    title: "Opportunities",
    description: OPPORTUNITIES_DESCRIPTION,
    alternates: { canonical: OPPORTUNITIES_PATH },
    openGraph: { ...OG_DEFAULTS, title: "Opportunities", description: OPPORTUNITIES_DESCRIPTION, url: OPPORTUNITIES_PATH },
    twitter: { card: "summary_large_image", title: "Opportunities", description: OPPORTUNITIES_DESCRIPTION },
  };
}

/** "Internship at Accenture. Closes Nov 15. Three-month internship for…", at most 160 characters. */
export function opportunityDescription(o: SeoOpportunity, isClosed: boolean, now: Date = new Date()): string {
  const when = isClosed ? "Closed." : `Closes ${formatManilaDate(o.closesAt, now)}.`;
  return truncate(`${KIND_NAMES[o.kind]} at ${o.organization}. ${when} ${o.summary.trim()}`, 160);
}

/** Open posts are indexed. Closed ones stay reachable for old links, but get noindex. */
export function opportunityMetadata(o: SeoOpportunity, isClosed: boolean, now: Date = new Date()): Metadata {
  const title = `${o.title} · ${o.organization}`;
  const description = opportunityDescription(o, isClosed, now);
  const url = opportunityPath(o.slug);
  return {
    title,
    description,
    alternates: { canonical: url },
    ...(isClosed ? { robots: PRIVATE_ROBOTS } : {}),
    openGraph: { ...OG_DEFAULTS, title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function missingOpportunityMetadata(): Metadata {
  return { title: "Opportunity not found", robots: PRIVATE_ROBOTS };
}

function place(o: SeoOpportunity): JsonLd {
  return {
    "@type": "Place",
    name: o.location ?? o.organization,
    address: {
      "@type": "PostalAddress",
      ...(o.location ? { streetAddress: o.location } : {}),
      addressCountry: "PH",
    },
  };
}

/**
 * Structured data so Google can show the post as a job or event result.
 * Internships become JobPosting. Events, and competitions with a start time,
 * become Event. Programs and closed posts get none.
 */
export function opportunityJsonLd(o: SeoOpportunity, origin: string, isClosed: boolean): JsonLd | null {
  if (isClosed) return null;
  const pageUrl = `${origin}${opportunityPath(o.slug)}`;
  const organization = { "@type": "Organization", name: o.organization };

  if (o.kind === "internship") {
    return {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: o.title,
      description: o.summary,
      datePosted: o.createdAt.toISOString(),
      validThrough: o.closesAt.toISOString(),
      employmentType: "INTERN",
      hiringOrganization: organization,
      directApply: false,
      url: pageUrl,
      ...(o.locationType === "online"
        ? {
            jobLocationType: "TELECOMMUTE",
            applicantLocationRequirements: { "@type": "Country", name: "Philippines" },
          }
        : { jobLocation: place(o) }),
    };
  }

  if ((o.kind === "event" || o.kind === "competition") && o.startsAt) {
    // The post page, not the organization's link: that is only shown to signed-in students.
    const online = { "@type": "VirtualLocation", url: pageUrl };
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: o.title,
      description: o.summary,
      startDate: o.startsAt.toISOString(),
      ...(o.endsAt ? { endDate: o.endsAt.toISOString() } : {}),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode:
        o.locationType === "online"
          ? "https://schema.org/OnlineEventAttendanceMode"
          : o.locationType === "hybrid"
            ? "https://schema.org/MixedEventAttendanceMode"
            : "https://schema.org/OfflineEventAttendanceMode",
      location: o.locationType === "online" ? online : o.locationType === "hybrid" ? [place(o), online] : place(o),
      organizer: organization,
      url: pageUrl,
    };
  }

  return null;
}

/** Sitemap entries: the list page, plus every open post. */
export function opportunitySitemapEntries(
  origin: string,
  open: Pick<SeoOpportunity, "slug" | "updatedAt">[],
): { url: string; lastModified?: string; changeFrequency: "daily" | "weekly"; priority: number }[] {
  return [
    { url: `${origin}${OPPORTUNITIES_PATH}`, changeFrequency: "daily", priority: 0.9 },
    ...open.map((o) => ({
      url: `${origin}${opportunityPath(o.slug)}`,
      lastModified: o.updatedAt.toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
