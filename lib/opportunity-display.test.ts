import { describe, expect, it } from "vitest";
import { actionLabel, dateTimeLabel, focusOpportunity, upcomingOpportunities, whereLabel } from "./opportunity-display";
import type { PublicOpportunity } from "./services/opportunities";

const now = new Date("2026-10-18T04:00:00Z"); // noon in Manila

describe("whereLabel", () => {
  it("joins the kind of place with the place", () => {
    expect(whereLabel({ locationType: "onsite", location: "PCU Manila, Room 402" })).toBe("On site, PCU Manila, Room 402");
  });
  it("shows only the kind when there is no place", () => {
    expect(whereLabel({ locationType: "online", location: null })).toBe("Online");
  });
});

describe("dateTimeLabel", () => {
  it("includes the Manila time", () => {
    expect(dateTimeLabel(new Date("2026-10-30T06:00:00Z"), now).replace(/\s/g, " ")).toBe("Oct 30, 2:00 PM");
  });
  it("drops the time for a date-only deadline, which is stored as 11:59 pm Manila", () => {
    expect(dateTimeLabel(new Date("2026-10-30T15:59:59.999Z"), now)).toBe("Oct 30");
  });
});

const HOUR_MS = 60 * 60 * 1000;

/** A post closing `hours` from now. */
function closingIn(slug: string, hours: number): PublicOpportunity {
  return {
    slug,
    kind: "event",
    title: slug,
    organization: "PCU",
    summary: "",
    url: "https://example.com",
    locationType: "online",
    location: null,
    startsAt: null,
    endsAt: null,
    deadline: null,
    closesAt: new Date(now.getTime() + hours * HOUR_MS),
    createdAt: now,
    updatedAt: now,
  };
}

describe("upcomingOpportunities", () => {
  it("lists the next three open posts, soonest closing first", () => {
    const posts = [closingIn("d", 200), closingIn("closed", -1), closingIn("a", 2), closingIn("c", 90), closingIn("b", 30)];
    expect(upcomingOpportunities(posts, now).map((p) => p.slug)).toEqual(["a", "b", "c"]);
    expect(upcomingOpportunities([closingIn("closed", -1)], now)).toEqual([]);
  });
});

describe("focusOpportunity", () => {
  it("picks the soonest open post only when it closes within three days", () => {
    expect(focusOpportunity([closingIn("later", 80), closingIn("soon", 20)], now)?.slug).toBe("soon");
    expect(focusOpportunity([closingIn("edge", 72)], now)?.slug).toBe("edge");
    expect(focusOpportunity([closingIn("later", 73), closingIn("closed", -1)], now)).toBeNull();
    expect(focusOpportunity([], now)).toBeNull();
  });
});

describe("actionLabel", () => {
  it("asks events and competitions to register, the rest to apply", () => {
    expect(actionLabel("event")).toBe("Register");
    expect(actionLabel("competition")).toBe("Register");
    expect(actionLabel("internship")).toBe("Apply");
    expect(actionLabel("program")).toBe("Apply");
  });
});
