import { beforeEach, describe, expect, it } from "vitest";
import { adminAuditLog } from "../db/schema";
import { createTestContext, type TestEnv } from "../test/helpers";
import { getStats } from "./admin";
import type { ServiceContext } from "./context";
import {
  countOpenOpportunities,
  createOpportunity,
  deleteOpportunity,
  getOpportunity,
  listOpenOpportunities,
  listOpportunitiesForAdmin,
  makeSlug,
  setOpportunityHidden,
  updateOpportunity,
  type CreateOpportunityInput,
} from "./opportunities";

describe("opportunities", () => {
  let env: TestEnv;
  let ctx: ServiceContext;
  let clock: Date;
  let adminId: string;
  let studentId: string;

  // 10 am Monday Oct 26, 2026, Philippine time.
  const START = new Date("2026-10-26T02:00:00Z");

  beforeEach(async () => {
    env = await createTestContext();
    clock = START;
    ctx = { ...env.ctx, now: () => clock };
    adminId = (await env.createUser({ admin: true })).id;
    studentId = (await env.createUser()).id;
  });

  const internship = (over: Partial<CreateOpportunityInput> = {}): CreateOpportunityInput => ({
    kind: "internship",
    title: "Software Engineering Intern",
    organization: "Accenture",
    summary: "Three-month internship for 3rd and 4th year IT and CS students.",
    url: "https://careers.example.com/intern",
    deadline: "2026-11-15",
    ...over,
  });

  describe("creating", () => {
    it("creates a post with a readable slug and records it in the audit log", async () => {
      const { slug } = await createOpportunity(ctx, adminId, internship());
      expect(slug).toMatch(/^accenture-software-engineering-intern-[a-z0-9]{4}$/);
      const page = await getOpportunity(ctx, slug);
      expect(page).toMatchObject({ kind: "internship", locationType: "onsite", isClosed: false });
      expect(page!.closesAt.toISOString()).toBe("2026-11-15T15:59:59.999Z");
      const log = await env.db.select().from(adminAuditLog);
      expect(log.map((l) => l.action)).toEqual(["create_opportunity"]);
    });

    it("gives two posts with the same title different slugs", async () => {
      const a = await createOpportunity(ctx, adminId, internship());
      const b = await createOpportunity(ctx, adminId, internship());
      expect(a.slug).not.toBe(b.slug);
    });

    it("refuses students", async () => {
      await expect(createOpportunity(ctx, studentId, internship())).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it.each([
      [{ kind: "internship", deadline: "" }, "deadline", /last day to apply/],
      [{ kind: "program", deadline: undefined }, "deadline", /last day to apply/],
      [{ kind: "event", deadline: "", startsAt: undefined }, "startsAt", /event starts/],
      [{ kind: "competition", deadline: "", startsAt: "" }, "deadline", /registration deadline or a start/],
    ] as const)("enforces the date rules for each kind: %o", async (over, field, message) => {
      await expect(createOpportunity(ctx, adminId, internship(over as never))).rejects.toMatchObject({
        field,
        message: expect.stringMatching(message),
      });
    });

    it("accepts each kind with its minimum dates", async () => {
      await createOpportunity(ctx, adminId, internship({ kind: "event", deadline: "", startsAt: "2026-10-30T14:00" }));
      await createOpportunity(ctx, adminId, internship({ kind: "competition", deadline: "2026-11-01" }));
      await createOpportunity(ctx, adminId, internship({ kind: "program", deadline: "2026-12-01" }));
      expect(await countOpenOpportunities(ctx)).toEqual({ internship: 0, event: 1, competition: 1, program: 1 });
    });

    it("validates links, lengths, dates and order", async () => {
      await expect(createOpportunity(ctx, adminId, internship({ url: "http://x.example" }))).rejects.toMatchObject({ field: "url" });
      await expect(createOpportunity(ctx, adminId, internship({ title: "x".repeat(121) }))).rejects.toMatchObject({ field: "title" });
      await expect(createOpportunity(ctx, adminId, internship({ organization: " " }))).rejects.toMatchObject({ field: "organization" });
      await expect(createOpportunity(ctx, adminId, internship({ deadline: "next week" }))).rejects.toMatchObject({ field: "deadline" });
      await expect(createOpportunity(ctx, adminId, internship({ kind: "bootcamp" as never }))).rejects.toMatchObject({ field: "kind" });
      await expect(
        createOpportunity(ctx, adminId, internship({ kind: "event", deadline: "", startsAt: "2026-10-30T14:00", endsAt: "2026-10-30T13:00" })),
      ).rejects.toMatchObject({ field: "endsAt" });
      await expect(
        createOpportunity(ctx, adminId, internship({ kind: "event", deadline: "", endsAt: "2026-10-30T13:00" })),
      ).rejects.toMatchObject({ field: "startsAt" });
    });

    it("refuses a post that would already be closed", async () => {
      await expect(createOpportunity(ctx, adminId, internship({ deadline: "2026-10-25" }))).rejects.toMatchObject({
        field: "deadline",
        message: expect.stringMatching(/already be closed/),
      });
    });
  });

  describe("listing and closing", () => {
    it("lists open posts soonest closing first, filters by kind, and drops closed ones", async () => {
      await createOpportunity(ctx, adminId, internship({ title: "Late", deadline: "2026-11-20" }));
      await createOpportunity(ctx, adminId, internship({ title: "Soon", deadline: "2026-10-28" }));
      await createOpportunity(ctx, adminId, internship({ kind: "event", title: "Meetup", deadline: "", startsAt: "2026-10-27T18:00" }));

      expect((await listOpenOpportunities(ctx)).map((o) => o.title)).toEqual(["Meetup", "Soon", "Late"]);
      expect((await listOpenOpportunities(ctx, { kind: "event" })).map((o) => o.title)).toEqual(["Meetup"]);

      // Wednesday 12:30 am: the meetup ended Tuesday, and "Soon" closes at the end of Wednesday.
      clock = new Date("2026-10-27T16:30:00Z");
      expect((await listOpenOpportunities(ctx)).map((o) => o.title)).toEqual(["Soon", "Late"]);
    });

    it("still finds a closed post by slug, marked closed", async () => {
      const { slug } = await createOpportunity(ctx, adminId, internship({ deadline: "2026-10-28" }));
      clock = new Date("2026-11-01T00:00:00Z");
      expect(await getOpportunity(ctx, slug)).toMatchObject({ isClosed: true });
      expect(await listOpenOpportunities(ctx)).toEqual([]);
      expect(await getOpportunity(ctx, "no-such-post")).toBeNull();
      expect(await getOpportunity(ctx, "../../etc/passwd")).toBeNull();
    });

    it("hides and restores a post, with a required reason", async () => {
      const { id, slug } = await createOpportunity(ctx, adminId, internship());
      await expect(setOpportunityHidden(ctx, adminId, id, true)).rejects.toMatchObject({ field: "reason" });
      await setOpportunityHidden(ctx, adminId, id, true, "Reported as a scam");
      expect(await getOpportunity(ctx, slug)).toBeNull();
      expect(await listOpenOpportunities(ctx)).toEqual([]);
      const [adminView] = await listOpportunitiesForAdmin(ctx, adminId);
      expect(adminView).toMatchObject({ isHidden: true, hiddenReason: "Reported as a scam" });
      await setOpportunityHidden(ctx, adminId, id, false);
      expect(await getOpportunity(ctx, slug)).not.toBeNull();
    });
  });

  describe("updating and deleting", () => {
    it("recomputes the closing time and keeps the slug", async () => {
      const { id, slug } = await createOpportunity(ctx, adminId, internship());
      const updated = await updateOpportunity(ctx, adminId, id, { deadline: "2026-12-01", title: "Data Intern" });
      expect(updated.slug).toBe(slug);
      const page = await getOpportunity(ctx, slug);
      expect(page).toMatchObject({ title: "Data Intern" });
      expect(page!.closesAt.toISOString()).toBe("2026-12-01T15:59:59.999Z");
    });

    it("re-checks the rules against the merged post", async () => {
      const { id } = await createOpportunity(ctx, adminId, internship());
      await expect(updateOpportunity(ctx, adminId, id, { deadline: "" })).rejects.toMatchObject({ field: "deadline" });
      await expect(updateOpportunity(ctx, adminId, id, { slug: "mine" } as never)).rejects.toMatchObject({ code: "VALIDATION" });
      await expect(updateOpportunity(ctx, studentId, id, { title: "x" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(updateOpportunity(ctx, adminId, "not-a-uuid", { title: "x" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("deletes only when confirmed", async () => {
      const { id, slug } = await createOpportunity(ctx, adminId, internship());
      await expect(deleteOpportunity(ctx, adminId, id, { confirm: false })).rejects.toMatchObject({ field: "confirm" });
      await deleteOpportunity(ctx, adminId, id, { confirm: true });
      expect(await getOpportunity(ctx, slug)).toBeNull();
      const actions = (await env.db.select().from(adminAuditLog)).map((l) => l.action);
      expect(actions).toEqual(["create_opportunity", "delete_opportunity"]);
    });
  });

  it("counts open posts in admin stats, for the launch gate", async () => {
    await createOpportunity(ctx, adminId, internship());
    await createOpportunity(ctx, adminId, internship({ kind: "program", deadline: "2026-12-01" }));
    expect((await getStats(ctx, adminId)).openOpportunities).toEqual({ internship: 1, event: 0, competition: 0, program: 1 });
  });
});

describe("makeSlug", () => {
  it("strips accents and symbols, caps the length, and adds a random ending", () => {
    expect(makeSlug("Café Ñino & Co.", "Intern!")).toMatch(/^cafe-nino-co-intern-[a-z0-9]{4}$/);
    const long = makeSlug("Organization", "word ".repeat(30));
    expect(long.length).toBeLessThanOrEqual(65);
    expect(makeSlug("!!!", "???")).toMatch(/^opportunity-[a-z0-9]{4}$/);
  });
});
