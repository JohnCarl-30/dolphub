import { describe, expect, it } from "vitest";
import { actionLabel, focusOpportunity, mockOpportunities, upcomingOpportunities } from "./mock-home";

// 10 am in Manila on a fixed day, so the relative dates are deterministic.
const NOW = new Date("2026-10-18T02:00:00Z");

describe("mock home content", () => {
  const posts = mockOpportunities(NOW);

  it("covers every kind and includes a closed post to filter out", () => {
    expect(new Set(posts.map((item) => item.kind))).toEqual(
      new Set(["internship", "event", "competition", "program"]),
    );
    expect(posts.some((item) => item.closesAt.getTime() <= NOW.getTime())).toBe(true);
  });

  it("uses the backend's rules: https links, unique slugs, closing time set", () => {
    expect(new Set(posts.map((item) => item.slug)).size).toBe(posts.length);
    for (const item of posts) {
      expect(item.url.startsWith("https://")).toBe(true);
      expect(item.closesAt).toBeInstanceOf(Date);
    }
  });

  it("lists the next three open posts, soonest closing first", () => {
    const upcoming = upcomingOpportunities(posts, NOW);
    expect(upcoming).toHaveLength(3);
    expect(upcoming.every((item) => item.closesAt.getTime() > NOW.getTime())).toBe(true);
    const times = upcoming.map((item) => item.closesAt.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(upcoming[0]?.slug).toBe("pcu-cs-society-hack-night-q8m2");
  });

  it("focuses the soonest post only when it closes within three days", () => {
    expect(focusOpportunity(posts, NOW)?.slug).toBe("pcu-cs-society-hack-night-q8m2");
    const later = posts.filter((item) => item.closesAt.getTime() - NOW.getTime() > 4 * 86_400_000);
    expect(focusOpportunity(later, NOW)).toBeNull();
    expect(focusOpportunity([], NOW)).toBeNull();
  });

  it("asks events and competitions to register, the rest to apply", () => {
    expect(actionLabel("event")).toBe("Register");
    expect(actionLabel("competition")).toBe("Register");
    expect(actionLabel("internship")).toBe("Apply");
    expect(actionLabel("program")).toBe("Apply");
  });
});
