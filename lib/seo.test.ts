import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_URL,
  isIndexable,
  missingProfileMetadata,
  opportunityJsonLd,
  opportunityMetadata,
  opportunitySitemapEntries,
  type SeoOpportunity,
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

describe("opportunity SEO", () => {
  const now = new Date("2026-10-26T02:00:00Z");
  const base: SeoOpportunity = {
    slug: "accenture-software-intern-k3f9",
    kind: "internship",
    title: "Software Intern",
    organization: "Accenture",
    summary: "Three-month internship for IT and CS students.",
    locationType: "onsite",
    location: "Ortigas, Pasig",
    startsAt: null,
    endsAt: null,
    closesAt: new Date("2026-11-15T15:59:59.999Z"),
    createdAt: new Date("2026-10-20T00:00:00Z"),
    updatedAt: new Date("2026-10-21T00:00:00Z"),
  };

  it("indexes open posts and hides closed ones from search", () => {
    const open = opportunityMetadata(base, false, now);
    expect(open.title).toBe("Software Intern · Accenture");
    expect(open.description).toBe(
      "Internship at Accenture. Closes Nov 15. Three-month internship for IT and CS students.",
    );
    expect(open.alternates?.canonical).toBe("/opportunities/accenture-software-intern-k3f9");
    expect(open.robots).toBeUndefined();
    expect(open.openGraph).toMatchObject({ siteName: "Dolphub" });
    expect(opportunityMetadata(base, true, now).robots).toEqual({ index: false, follow: false });
    expect(opportunityMetadata(base, true, now).description).toContain("Closed.");
  });

  it("describes internships as job postings", () => {
    expect(opportunityJsonLd(base, "https://dolphub.tech", false)).toMatchObject({
      "@type": "JobPosting",
      employmentType: "INTERN",
      validThrough: "2026-11-15T15:59:59.999Z",
      hiringOrganization: { name: "Accenture" },
      jobLocation: { address: { streetAddress: "Ortigas, Pasig", addressCountry: "PH" } },
    });
    expect(opportunityJsonLd({ ...base, locationType: "online" }, "https://dolphub.tech", false)).toMatchObject({
      jobLocationType: "TELECOMMUTE",
    });
  });

  it("describes events with a start time as events, and skips the rest", () => {
    const event = { ...base, kind: "event" as const, startsAt: new Date("2026-10-30T06:00:00Z"), locationType: "hybrid" as const };
    const ld = opportunityJsonLd(event, "https://dolphub.tech", false)!;
    expect(ld).toMatchObject({ "@type": "Event", startDate: "2026-10-30T06:00:00.000Z" });
    expect(ld.eventAttendanceMode).toBe("https://schema.org/MixedEventAttendanceMode");
    expect(ld.location).toHaveLength(2);
    // The online part points at the post page. The organization's link is for signed-in students only.
    expect(ld.location).toContainEqual({ "@type": "VirtualLocation", url: "https://dolphub.tech/opportunities/" + base.slug });
    expect(opportunityJsonLd({ ...base, kind: "competition" }, "https://dolphub.tech", false)).toBeNull();
    expect(opportunityJsonLd({ ...base, kind: "program" }, "https://dolphub.tech", false)).toBeNull();
    expect(opportunityJsonLd(base, "https://dolphub.tech", true)).toBeNull();
  });

  it("lists the page and open posts in the sitemap", () => {
    expect(opportunitySitemapEntries("https://dolphub.tech", [base])).toEqual([
      { url: "https://dolphub.tech/opportunities", changeFrequency: "daily", priority: 0.9 },
      {
        url: "https://dolphub.tech/opportunities/accenture-software-intern-k3f9",
        lastModified: "2026-10-21T00:00:00.000Z",
        changeFrequency: "weekly",
        priority: 0.6,
      },
    ]);
  });
});
