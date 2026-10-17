import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_URL,
  isIndexable,
  missingProfileMetadata,
  profileDescription,
  profileMetadata,
  profilePageJsonLd,
  serializeJsonLd,
  siteUrl,
  websiteJsonLd,
  type SeoProfile,
} from "./seo";

const profile = (over: Partial<SeoProfile> = {}): SeoProfile => ({
  handle: "mira",
  displayName: "Mira Santos",
  tagline: "Campus apps for people who still use Messenger.",
  courseName: "BS Information Technology",
  coverImageUrl: null,
  updatedAt: null,
  source: "real",
  searchVisible: true,
  ...over,
});

describe("siteUrl", () => {
  it("uses APP_URL's origin and falls back to dolphub.tech", () => {
    expect(siteUrl({ APP_URL: "https://dolphub.tech/" })).toBe("https://dolphub.tech");
    expect(siteUrl({ APP_URL: "http://localhost:3000" })).toBe("http://localhost:3000");
    expect(siteUrl({})).toBe(DEFAULT_SITE_URL);
    expect(siteUrl({ APP_URL: "not a url" })).toBe(DEFAULT_SITE_URL);
    expect(siteUrl({ APP_URL: "ftp://dolphub.tech" })).toBe(DEFAULT_SITE_URL);
  });
});

describe("isIndexable", () => {
  it("indexes only real students who have not opted out", () => {
    expect(isIndexable(profile())).toBe(true);
    expect(isIndexable(profile({ searchVisible: false }))).toBe(false);
    expect(isIndexable(profile({ source: "mock" }))).toBe(false);
    expect(isIndexable(profile({ source: "mock", searchVisible: false }))).toBe(false);
  });
});

describe("profileMetadata", () => {
  it("marks sample profiles noindex and real ones indexable", () => {
    expect(profileMetadata(profile({ source: "mock" })).robots).toEqual({ index: false, follow: false });
    expect(profileMetadata(profile({ searchVisible: false })).robots).toEqual({ index: false, follow: false });
    expect(profileMetadata(profile()).robots).toBeUndefined();
  });

  it("sets the canonical, a profile Open Graph type, and keeps the site name", () => {
    const m = profileMetadata(profile({ handle: "Mira" }));
    expect(m.title).toBe("Mira Santos");
    expect(m.alternates?.canonical).toBe("/u/mira");
    expect(m.openGraph).toMatchObject({ type: "profile", siteName: "Dolphub", locale: "en_PH", url: "/u/mira" });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("keeps descriptions within 160 characters", () => {
    expect(profileDescription(profile())).toBe(
      "Mira Santos, BS Information Technology at PCU. Campus apps for people who still use Messenger.",
    );
    const long = profileDescription(profile({ tagline: "word ".repeat(80) }));
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith("…")).toBe(true);
    expect(profileDescription(profile({ tagline: "" }))).toContain("See their projects on Dolphub.");
  });

  it("hides unknown handles from search", () => {
    expect(missingProfileMetadata().robots).toEqual({ index: false, follow: false });
  });
});

describe("JSON-LD", () => {
  it("describes the site and a profile page", () => {
    expect(websiteJsonLd("https://dolphub.tech")).toMatchObject({ "@type": "WebSite", url: "https://dolphub.tech/" });
    const page = profilePageJsonLd(
      profile({ coverImageUrl: "https://images.dolphub.tech/a.webp", updatedAt: "2026-10-20T00:00:00.000Z" }),
      "https://dolphub.tech",
    );
    expect(page).toMatchObject({
      "@type": "ProfilePage",
      url: "https://dolphub.tech/u/mira",
      dateModified: "2026-10-20T00:00:00.000Z",
      mainEntity: { "@type": "Person", name: "Mira Santos", alternateName: "mira", image: "https://images.dolphub.tech/a.webp" },
    });
  });

  it("escapes < so student text cannot end the script tag", () => {
    const out = serializeJsonLd(profilePageJsonLd(profile({ tagline: "</script><script>alert(1)</script>" }), "https://x"));
    expect(out).not.toContain("<");
    expect(JSON.parse(out).mainEntity.description).toContain("</script>");
  });
});
