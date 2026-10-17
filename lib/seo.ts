import type { Metadata } from "next";

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
  colors: { background: "#ffffff", ink: "#0e1012", muted: "#60636a", paper: "#f5f5f3", accent: "#047857" },
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
