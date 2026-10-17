import { describe, expect, it } from "vitest";
import {
  closesAtFor,
  closingLabel,
  endOfManilaDay,
  formatManilaDate,
  formatManilaTime,
  parseManilaDateTime,
} from "./opportunity-time";

describe("parseManilaDateTime", () => {
  it("reads a date as the end of that day in Philippine time", () => {
    expect(parseManilaDateTime("2026-10-30")?.toISOString()).toBe("2026-10-30T15:59:59.999Z");
  });

  it("reads a form time as Philippine time", () => {
    expect(parseManilaDateTime("2026-10-30T14:00")?.toISOString()).toBe("2026-10-30T06:00:00.000Z");
    expect(parseManilaDateTime("2026-10-31T00:30:15")?.toISOString()).toBe("2026-10-30T16:30:15.000Z");
  });

  it("keeps explicit time zones", () => {
    expect(parseManilaDateTime("2026-10-30T06:00:00Z")?.toISOString()).toBe("2026-10-30T06:00:00.000Z");
    expect(parseManilaDateTime("2026-10-30T14:00:00+08:00")?.toISOString()).toBe("2026-10-30T06:00:00.000Z");
  });

  it("treats empty as missing and rejects nonsense", () => {
    expect(parseManilaDateTime("")).toBeUndefined();
    expect(parseManilaDateTime(null)).toBeUndefined();
    expect(parseManilaDateTime("2026-02-30")).toBeNull();
    expect(parseManilaDateTime("2026-10-30T25:00")).toBeNull();
    expect(parseManilaDateTime("next friday")).toBeNull();
    expect(parseManilaDateTime("2026-10-30T14:00:00")?.toISOString()).toBe("2026-10-30T06:00:00.000Z");
    expect(parseManilaDateTime(12345)).toBeNull();
  });
});

describe("closing time", () => {
  const d = (iso: string) => new Date(iso);

  it("uses the deadline, else the end, else the end of the start day", () => {
    const deadline = d("2026-10-25T15:59:59.999Z");
    const startsAt = d("2026-10-31T01:00:00Z"); // 9 am Oct 31, Manila
    const endsAt = d("2026-10-31T09:00:00Z");
    expect(closesAtFor({ deadline, startsAt, endsAt })).toEqual(deadline);
    expect(closesAtFor({ startsAt, endsAt })).toEqual(endsAt);
    expect(closesAtFor({ startsAt })?.toISOString()).toBe("2026-10-31T15:59:59.999Z");
    expect(closesAtFor({})).toBeNull();
  });

  it("finds the end of the Manila day, even late at night UTC", () => {
    // 11 pm UTC Oct 30 is already 7 am Oct 31 in Manila.
    expect(endOfManilaDay(d("2026-10-30T23:00:00Z")).toISOString()).toBe("2026-10-31T15:59:59.999Z");
  });
});

describe("labels", () => {
  const now = new Date("2026-10-26T02:00:00Z"); // 10 am Oct 26, Manila

  it("counts days in Philippine time", () => {
    expect(closingLabel(new Date("2026-10-26T15:59:59Z"), now)).toBe("Closes today");
    expect(closingLabel(new Date("2026-10-26T16:30:00Z"), now)).toBe("Closes tomorrow");
    expect(closingLabel(new Date("2026-10-29T10:00:00Z"), now)).toBe("Closes in 3 days");
    expect(closingLabel(new Date("2026-11-20T10:00:00Z"), now)).toBe("Closes Nov 20");
    expect(closingLabel(new Date("2026-10-26T01:00:00Z"), now)).toBe("Closed");
  });

  it("formats dates and times in Philippine time", () => {
    expect(formatManilaDate(new Date("2026-10-30T16:30:00Z"), now)).toBe("Oct 31");
    expect(formatManilaDate(new Date("2027-01-05T00:00:00Z"), now)).toBe("Jan 5, 2027");
    expect(formatManilaTime(new Date("2026-10-30T06:00:00Z"))).toBe("2:00 PM");
  });
});
