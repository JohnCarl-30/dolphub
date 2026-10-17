import { randomInt } from "node:crypto";
import { and, asc, count, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { opportunities } from "../db/schema";
import { closesAtFor, parseManilaDateTime } from "../opportunity-time";
import { audit, requireAdmin } from "./access";
import { nowOf, type ServiceContext } from "./context";
import { isUniqueViolation, ServiceError } from "./errors";
import * as v from "./validation";

export const OPPORTUNITY_KINDS = ["internship", "event", "competition", "program"] as const;
export type OpportunityKind = (typeof OPPORTUNITY_KINDS)[number];

export const LOCATION_TYPES = ["onsite", "online", "hybrid"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

/** Display names, singular and plural, for tabs and badges. */
export const KIND_LABELS: Record<OpportunityKind, { one: string; many: string }> = {
  internship: { one: "Internship", many: "Internships" },
  event: { one: "Event", many: "Events" },
  competition: { one: "Competition", many: "Competitions" },
  program: { one: "Program", many: "Programs" },
};

type Row = typeof opportunities.$inferSelect;

/** What the public pages get. Dates are Date objects; format them with lib/opportunity-time. */
export interface PublicOpportunity {
  slug: string;
  kind: OpportunityKind;
  title: string;
  organization: string;
  summary: string;
  url: string;
  locationType: LocationType;
  location: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  deadline: Date | null;
  closesAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminOpportunity extends PublicOpportunity {
  id: string;
  isHidden: boolean;
  hiddenReason: string | null;
  isClosed: boolean;
}

function toPublic(row: Row): PublicOpportunity {
  return {
    slug: row.slug,
    kind: row.kind as OpportunityKind,
    title: row.title,
    organization: row.organization,
    summary: row.summary,
    url: row.url,
    locationType: row.locationType as LocationType,
    location: row.location,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    deadline: row.deadline,
    closesAt: row.closesAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const text = (label: string, max: number) =>
  z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

/** A date from a form or API. Empty clears it. See parseManilaDateTime for the accepted forms. */
const dateField = (label: string) =>
  z.unknown().optional().transform((value, ctx) => {
    const parsed = parseManilaDateTime(value);
    if (parsed === null) {
      ctx.addIssue({
        code: "custom",
        message: `${label} must be a date like 2026-10-30 or a date and time like 2026-10-30T14:00`,
      });
      return z.NEVER;
    }
    return parsed ?? null;
  });

const fields = {
  kind: z.enum(OPPORTUNITY_KINDS, "Choose internship, event, competition or program"),
  title: text("Title", 120),
  organization: text("Organization", 80),
  summary: text("Summary", 500),
  url: v.httpsUrl,
  locationType: z.enum(LOCATION_TYPES, "Choose on-site, online or hybrid"),
  location: v.optional(z.string().trim().max(120, "Place must be at most 120 characters")),
  startsAt: dateField("Start"),
  endsAt: dateField("End"),
  deadline: dateField("Deadline"),
};

const createSchema = z.object({ ...fields, locationType: fields.locationType.default("onsite") });
const updateSchema = z.object(fields).partial().strict();

export type CreateOpportunityInput = z.input<typeof createSchema>;
export type UpdateOpportunityInput = z.input<typeof updateSchema>;

interface Dates {
  kind: OpportunityKind;
  startsAt?: Date | null;
  endsAt?: Date | null;
  deadline?: Date | null;
}

/** Checks the date rules for each kind, and returns when the post closes. */
function checkDates(d: Dates): Date {
  if ((d.kind === "internship" || d.kind === "program") && !d.deadline) {
    throw new ServiceError("VALIDATION", "Add the last day to apply", "deadline");
  }
  if (d.kind === "event" && !d.startsAt) {
    throw new ServiceError("VALIDATION", "Add when the event starts", "startsAt");
  }
  if (d.kind === "competition" && !d.deadline && !d.startsAt) {
    throw new ServiceError("VALIDATION", "Add a registration deadline or a start time", "deadline");
  }
  if (d.endsAt && !d.startsAt) {
    throw new ServiceError("VALIDATION", "Add a start time to go with the end time", "startsAt");
  }
  if (d.endsAt && d.startsAt && d.endsAt < d.startsAt) {
    throw new ServiceError("VALIDATION", "The end must be after the start", "endsAt");
  }
  return closesAtFor(d)!;
}

/** "accenture-software-intern-k3f9": organization and title, plus 4 random characters. */
export function makeSlug(organization: string, title: string): string {
  const base = `${organization} ${title}`
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const cut = base.length > 60 ? base.slice(0, 60).replace(/-[^-]*$/, "") || base.slice(0, 60) : base;
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const suffix = Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return `${cut || "opportunity"}-${suffix}`;
}

async function findById(db: Db, id: string): Promise<Row> {
  const parsed = z.uuid().safeParse(id);
  const [row] = parsed.success
    ? await db.select().from(opportunities).where(eq(opportunities.id, parsed.data))
    : [];
  if (!row) throw new ServiceError("NOT_FOUND", "Opportunity not found");
  return row;
}

/** Admins only. Returns the slug for the post's public address. */
export async function createOpportunity(
  ctx: ServiceContext,
  actorUserId: string,
  input: CreateOpportunityInput,
): Promise<{ id: string; slug: string }> {
  await requireAdmin(ctx.db, actorUserId);
  const data = v.parse(createSchema, input);
  const closesAt = checkDates(data);
  if (closesAt <= nowOf(ctx)) {
    throw new ServiceError(
      "VALIDATION",
      "This would already be closed. Check the dates.",
      data.deadline ? "deadline" : "startsAt",
    );
  }

  for (let attempt = 0; ; attempt++) {
    try {
      const [row] = await ctx.db
        .insert(opportunities)
        .values({
          slug: makeSlug(data.organization, data.title),
          kind: data.kind,
          title: data.title,
          organization: data.organization,
          summary: data.summary,
          url: data.url,
          locationType: data.locationType,
          location: data.location ?? null,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          deadline: data.deadline,
          closesAt,
          createdBy: actorUserId,
        })
        .returning({ id: opportunities.id, slug: opportunities.slug });
      await audit(ctx.db, { actorUserId, action: "create_opportunity", target: `opportunity:${row!.id}` });
      return row!;
    } catch (error) {
      // A slug collision is rare. Try again with a new random ending.
      if (isUniqueViolation(error) && attempt < 3) continue;
      throw error;
    }
  }
}

/** Admins only. Send only the changed fields. The slug never changes, so shared links keep working. */
export async function updateOpportunity(
  ctx: ServiceContext,
  actorUserId: string,
  id: string,
  input: UpdateOpportunityInput,
): Promise<{ slug: string }> {
  await requireAdmin(ctx.db, actorUserId);
  const patch = v.parse(updateSchema, input);
  const row = await findById(ctx.db, id);
  const merged = {
    kind: (patch.kind ?? row.kind) as OpportunityKind,
    startsAt: patch.startsAt !== undefined ? patch.startsAt : row.startsAt,
    endsAt: patch.endsAt !== undefined ? patch.endsAt : row.endsAt,
    deadline: patch.deadline !== undefined ? patch.deadline : row.deadline,
  };
  const closesAt = checkDates(merged);
  await ctx.db
    .update(opportunities)
    .set({ ...patch, ...merged, closesAt, updatedAt: nowOf(ctx) })
    .where(eq(opportunities.id, row.id));
  await audit(ctx.db, { actorUserId, action: "update_opportunity", target: `opportunity:${row.id}` });
  return { slug: row.slug };
}

/** Admins only. Takes a post down at once, for example a scam or a cancelled event. */
export async function setOpportunityHidden(
  ctx: ServiceContext,
  actorUserId: string,
  id: string,
  hidden: boolean,
  reason?: string,
): Promise<{ slug: string }> {
  await requireAdmin(ctx.db, actorUserId);
  const row = await findById(ctx.db, id);
  const why = reason?.trim() || null;
  if (hidden && !why) throw new ServiceError("VALIDATION", "Give a reason", "reason");
  await ctx.db
    .update(opportunities)
    .set({ isHidden: hidden, hiddenReason: hidden ? why : null, updatedAt: nowOf(ctx) })
    .where(eq(opportunities.id, row.id));
  await audit(ctx.db, {
    actorUserId,
    action: hidden ? "hide_opportunity" : "unhide_opportunity",
    target: `opportunity:${row.id}`,
    reason: why,
  });
  return { slug: row.slug };
}

/** Admins only. Permanent. Prefer hiding, so shared links still explain what happened. */
export async function deleteOpportunity(
  ctx: ServiceContext,
  actorUserId: string,
  id: string,
  options: { confirm: boolean },
): Promise<{ slug: string }> {
  if (options.confirm !== true) {
    throw new ServiceError("VALIDATION", "Deletion must be confirmed", "confirm");
  }
  await requireAdmin(ctx.db, actorUserId);
  const row = await findById(ctx.db, id);
  await ctx.db.delete(opportunities).where(eq(opportunities.id, row.id));
  await audit(ctx.db, { actorUserId, action: "delete_opportunity", target: `opportunity:${row.id}` });
  return { slug: row.slug };
}

/** Open posts, soonest closing first. Hidden and closed posts are left out. */
export async function listOpenOpportunities(
  ctx: ServiceContext,
  options: { kind?: OpportunityKind; limit?: number } = {},
): Promise<PublicOpportunity[]> {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 200);
  const kind = options.kind && OPPORTUNITY_KINDS.includes(options.kind) ? options.kind : undefined;
  const rows = await ctx.db
    .select()
    .from(opportunities)
    .where(
      and(
        eq(opportunities.isHidden, false),
        gt(opportunities.closesAt, nowOf(ctx)),
        kind ? eq(opportunities.kind, kind) : undefined,
      ),
    )
    .orderBy(asc(opportunities.closesAt), asc(opportunities.createdAt))
    .limit(limit);
  return rows.map(toPublic);
}

/**
 * One post by slug, including closed ones, so old shared links still work.
 * Null when it does not exist or is hidden.
 */
export async function getOpportunity(
  ctx: ServiceContext,
  rawSlug: string,
): Promise<(PublicOpportunity & { isClosed: boolean }) | null> {
  const slug = rawSlug.trim().toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const [row] = await ctx.db
    .select()
    .from(opportunities)
    .where(and(eq(opportunities.slug, slug), eq(opportunities.isHidden, false)));
  if (!row) return null;
  return { ...toPublic(row), isClosed: row.closesAt <= nowOf(ctx) };
}

/** Admins only. Every post, including hidden and closed ones, newest first. */
export async function listOpportunitiesForAdmin(
  ctx: ServiceContext,
  actorUserId: string,
): Promise<AdminOpportunity[]> {
  await requireAdmin(ctx.db, actorUserId);
  const now = nowOf(ctx);
  const rows = await ctx.db.select().from(opportunities).orderBy(desc(opportunities.createdAt)).limit(500);
  return rows.map((row) => ({
    ...toPublic(row),
    id: row.id,
    isHidden: row.isHidden,
    hiddenReason: row.hiddenReason,
    isClosed: row.closesAt <= now,
  }));
}

/** Open, visible posts per kind. Used by admin stats and the launch gate. */
export async function countOpenOpportunities(ctx: ServiceContext): Promise<Record<OpportunityKind, number>> {
  const rows = await ctx.db
    .select({ kind: opportunities.kind, n: count() })
    .from(opportunities)
    .where(and(eq(opportunities.isHidden, false), gt(opportunities.closesAt, nowOf(ctx))))
    .groupBy(opportunities.kind);
  const result = { internship: 0, event: 0, competition: 0, program: 0 };
  for (const r of rows) result[r.kind as OpportunityKind] = Number(r.n);
  return result;
}
