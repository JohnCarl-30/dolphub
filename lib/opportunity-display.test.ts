import { describe, expect, it } from "vitest";
import { dateTimeLabel, whereLabel } from "./opportunity-display";

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
