import { and, count, desc, eq, exists, gte, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { profiles, projects, users } from "../db/schema";
import { audit, requireAdmin } from "./access";
import { nowOf, type ServiceContext } from "./context";
import { ServiceError } from "./errors";
import { listProfileImageKeys } from "./images";
import { countOpenOpportunities, type OpportunityKind } from "./opportunities";
import { getSignupsFrozen, writeSignupsFrozen } from "./settings";
import * as v from "./validation";

/** The end-of-semester goal from the plan. */
export const PROFILE_TARGET = 50;

const reasonSchema = z.string().trim().min(1, "Give a reason").max(300, "Reason must be at most 300 characters");

async function findProfileByHandle(db: Db, handle: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.handle, handle.trim().toLowerCase()));
  if (!profile) throw new ServiceError("NOT_FOUND", "No profile with that handle");
  return profile;
}

export interface Stats {
  /** Visible profiles with at least one project. This is the plan's success metric. */
  activeProfiles: number;
  target: number;
  users: number;
  signupsLast7Days: number;
  hiddenProfiles: number;
  signupsFrozen: boolean;
  /** Open, visible opportunities per kind. The launch gate needs 10 across 3 kinds. */
  openOpportunities: Record<OpportunityKind, number>;
}

export async function getStats(ctx: ServiceContext, actorUserId: string): Promise<Stats> {
  await requireAdmin(ctx.db, actorUserId);
  const weekAgo = new Date(nowOf(ctx).getTime() - 7 * 24 * 60 * 60 * 1000);
  const hasProject = exists(
    ctx.db.select({ one: sql`1` }).from(projects).where(eq(projects.profileId, profiles.id)),
  );

  const [[active], [userCount], [recent], [hidden], frozen, openOpportunities] = await Promise.all([
    ctx.db
      .select({ n: count() })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(and(eq(profiles.isHidden, false), isNull(users.deletedAt), hasProject)),
    ctx.db.select({ n: count() }).from(users).where(isNull(users.deletedAt)),
    ctx.db
      .select({ n: count() })
      .from(users)
      .where(and(isNull(users.deletedAt), gte(users.createdAt, weekAgo))),
    ctx.db.select({ n: count() }).from(profiles).where(eq(profiles.isHidden, true)),
    getSignupsFrozen(ctx.db),
    countOpenOpportunities(ctx),
  ]);

  return {
    activeProfiles: Number(active!.n),
    target: PROFILE_TARGET,
    users: Number(userCount!.n),
    signupsLast7Days: Number(recent!.n),
    hiddenProfiles: Number(hidden!.n),
    signupsFrozen: frozen,
    openOpportunities,
  };
}

export async function listProfilesForAdmin(
  ctx: ServiceContext,
  actorUserId: string,
  options: { filter?: "recent" | "hidden"; limit?: number } = {},
) {
  await requireAdmin(ctx.db, actorUserId);
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const rows = await ctx.db
    .select({
      id: profiles.id,
      handle: profiles.handle,
      displayName: profiles.displayName,
      isHidden: profiles.isHidden,
      hiddenReason: profiles.hiddenReason,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(options.filter === "hidden" ? eq(profiles.isHidden, true) : undefined)
    .orderBy(desc(profiles.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const counts = await ctx.db
    .select({ profileId: projects.profileId, n: count() })
    .from(projects)
    .where(inArray(projects.profileId, rows.map((r) => r.id)))
    .groupBy(projects.profileId);
  const byProfile = new Map(counts.map((c) => [c.profileId, Number(c.n)]));
  return rows.map(({ id, ...rest }) => ({ ...rest, projectCount: byProfile.get(id) ?? 0 }));
}

/** Takes a page down immediately. Returns the handle so the caller can refresh the cached page. */
export async function hideProfile(
  ctx: ServiceContext,
  actorUserId: string,
  handle: string,
  reason: string,
): Promise<{ handle: string }> {
  await requireAdmin(ctx.db, actorUserId);
  const why = v.parse(reasonSchema, reason);
  const profile = await findProfileByHandle(ctx.db, handle);
  await ctx.db
    .update(profiles)
    .set({ isHidden: true, hiddenReason: why, updatedAt: sql`now()` })
    .where(eq(profiles.id, profile.id));
  await audit(ctx.db, { actorUserId, action: "hide_profile", target: `profile:${profile.id}`, reason: why });
  return { handle: profile.handle };
}

export async function unhideProfile(
  ctx: ServiceContext,
  actorUserId: string,
  handle: string,
): Promise<{ handle: string }> {
  await requireAdmin(ctx.db, actorUserId);
  const profile = await findProfileByHandle(ctx.db, handle);
  await ctx.db
    .update(profiles)
    .set({ isHidden: false, hiddenReason: null, updatedAt: sql`now()` })
    .where(eq(profiles.id, profile.id));
  await audit(ctx.db, { actorUserId, action: "unhide_profile", target: `profile:${profile.id}` });
  return { handle: profile.handle };
}

/** The signup kill switch. Existing users can still sign in. */
export async function setSignupsFrozen(
  ctx: ServiceContext,
  actorUserId: string,
  frozen: boolean,
  reason?: string,
): Promise<void> {
  await requireAdmin(ctx.db, actorUserId);
  await writeSignupsFrozen(ctx.db, frozen);
  await audit(ctx.db, {
    actorUserId,
    action: frozen ? "freeze_signups" : "unfreeze_signups",
    target: "site",
    reason: reason?.trim() || null,
  });
}

/**
 * Deletes an account and everything it owns. Users may delete themselves.
 * Admins may delete anyone. `confirm` must be exactly true.
 *
 * Order: mark deleted (the page disappears at once), delete R2 images,
 * then delete the user row, which cascades to profile, projects and images.
 * The caller must then refresh /u/<handle> to purge the cached page.
 */
export async function deleteAccount(
  ctx: ServiceContext,
  input: { actorUserId: string; targetUserId: string; confirm: boolean },
): Promise<{ handle: string | null; failedKeys: string[] }> {
  if (input.confirm !== true) {
    throw new ServiceError("VALIDATION", "Deletion must be confirmed", "confirm");
  }
  const isSelf = input.actorUserId === input.targetUserId;
  if (!isSelf) await requireAdmin(ctx.db, input.actorUserId);

  const parsed = z.uuid().safeParse(input.targetUserId);
  const [target] = parsed.success
    ? await ctx.db.select().from(users).where(eq(users.id, parsed.data))
    : [];
  if (!target) throw new ServiceError("NOT_FOUND", "Account not found");

  await ctx.db
    .update(users)
    .set({ deletedAt: target.deletedAt ?? nowOf(ctx) })
    .where(eq(users.id, target.id));

  const [profile] = await ctx.db.select().from(profiles).where(eq(profiles.userId, target.id));
  const failedKeys: string[] = [];
  if (profile) {
    for (const key of await listProfileImageKeys(ctx, profile.id)) {
      try {
        await ctx.storage.delete(key);
      } catch {
        failedKeys.push(key);
      }
    }
  }

  await ctx.db.delete(users).where(eq(users.id, target.id));
  await audit(ctx.db, {
    actorUserId: isSelf ? null : input.actorUserId,
    action: isSelf ? "self_delete_account" : "delete_account",
    target: `user:${target.id}`,
  });
  return { handle: profile?.handle ?? null, failedKeys };
}

/**
 * The admin screen's delete button. `confirmHandle` must match the handle,
 * typed by the admin. Admins cannot delete their own account this way, so a
 * slip cannot lock the last admin out. Any R2 file that fails to delete is
 * left for the nightly sweep.
 */
export async function deleteAccountByHandle(
  ctx: ServiceContext,
  actorUserId: string,
  handle: string,
  confirmHandle: string,
): Promise<{ handle: string }> {
  await requireAdmin(ctx.db, actorUserId);
  const profile = await findProfileByHandle(ctx.db, handle);
  if (confirmHandle.trim().toLowerCase() !== profile.handle) {
    throw new ServiceError("VALIDATION", `Type ${profile.handle} to confirm`, "confirm");
  }
  if (profile.userId === actorUserId) {
    throw new ServiceError("FORBIDDEN", "You cannot delete your own account from the admin page");
  }
  await deleteAccount(ctx, { actorUserId, targetUserId: profile.userId, confirm: true });
  return { handle: profile.handle };
}
