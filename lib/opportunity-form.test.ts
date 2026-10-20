import { describe, expect, it } from "vitest";
import { changedFields, EMPTY_FORM, toActionInput, toFormValues } from "./opportunity-form";
import { parseManilaDateTime } from "./opportunity-time";
import type { PublicOpportunity } from "./services/opportunities";

const post: PublicOpportunity = {
  slug: "acme-intern-a1b2",
  kind: "internship",
  title: "Software engineering intern",
  organization: "Acme Labs",
  summary: "Three months on the platform team.",
  url: "https://example.com/apply",
  locationType: "onsite",
  location: null,
  startsAt: parseManilaDateTime("2026-11-02T09:00")!,
  endsAt: null,
  deadline: parseManilaDateTime("2026-10-30")!,
  closesAt: parseManilaDateTime("2026-10-30")!,
  createdAt: new Date("2026-10-19T00:00:00Z"),
  updatedAt: new Date("2026-10-19T00:00:00Z"),
};

describe("toFormValues", () => {
  it("shows dates in Philippine time, with no time for an end-of-day deadline", () => {
    const values = toFormValues(post);
    expect(values.deadlineDate).toBe("2026-10-30");
    expect(values.deadlineTime).toBe("");
    expect(values.startsAt).toBe("2026-11-02T09:00");
    expect(values.endsAt).toBe("");
    expect(values.location).toBe("");
  });

  it("keeps a deadline's time when it has one", () => {
    const values = toFormValues({ ...post, deadline: parseManilaDateTime("2026-10-30T17:00")! });
    expect(values.deadlineDate).toBe("2026-10-30");
    expect(values.deadlineTime).toBe("17:00");
  });
});

describe("toActionInput", () => {
  it("joins the deadline's date and time, and leaves empty dates empty", () => {
    expect(toActionInput({ ...EMPTY_FORM, deadlineDate: "2026-10-30" }).deadline).toBe("2026-10-30");
    expect(toActionInput({ ...EMPTY_FORM, deadlineDate: "2026-10-30", deadlineTime: "17:00" }).deadline).toBe(
      "2026-10-30T17:00",
    );
    // A time without a date means nothing.
    expect(toActionInput({ ...EMPTY_FORM, deadlineTime: "17:00" }).deadline).toBe("");
    expect(toActionInput(EMPTY_FORM).startsAt).toBe("");
  });
});

describe("changedFields", () => {
  it("is empty when nothing changed, so a saved deadline is never rewritten", () => {
    const values = toFormValues(post);
    expect(changedFields(values, { ...values })).toEqual({});
  });

  it("sends only what changed, with an empty value to clear a field", () => {
    const values = toFormValues(post);
    expect(changedFields(values, { ...values, title: "Backend intern", startsAt: "" })).toEqual({
      title: "Backend intern",
      startsAt: "",
    });
  });
});
