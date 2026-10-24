import { describe, expect, it } from "vitest";
import { selectFeaturedStudents } from "./featured-students";
import type { ShowcaseCard } from "./showcase-data";

const card = (handle: string): ShowcaseCard => ({
  handle,
  displayName: handle,
  tagline: "A portfolio",
  courseName: "BSIT",
  coverImageUrl: null,
  featuredProject: { title: "Project", description: "" },
});

describe("selectFeaturedStudents", () => {
  it("keeps configured order and skips unavailable or duplicate handles", async () => {
    expect(selectFeaturedStudents(["kenji", "missing", "MIRA", "kenji"], [card("mira"), card("kenji")]).map((profile) => profile.handle)).toEqual(["kenji", "mira"]);
  });

  it("returns no cards when no handles are configured", () => {
    expect(selectFeaturedStudents([], [card("mira")])).toEqual([]);
  });
});
