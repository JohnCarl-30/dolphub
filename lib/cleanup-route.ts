import { timingSafeEqual } from "node:crypto";
import { lt } from "drizzle-orm";
import { analyticsDedupe } from "./db/schema";
import { logError } from "./log";
import { purgeExpiredAuthRecords } from "./services/auth";
import type { ServiceContext } from "./services/context";
import { sweepOrphanedImages } from "./services/images";

export interface CleanupRouteDeps {
  context: () => Promise<ServiceContext>;
  /** CRON_SECRET. Vercel sends it as a bearer token with every scheduled request. Unset refuses all requests. */
  secret: string | undefined;
}

export interface CleanupReport {
  ok: boolean;
  /** Null when that job failed. */
  images: { deleted: number; failed: number } | null;
  auth: { loginTokens: number; sessions: number } | null;
  analytics: number | null;
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Constant-time comparison for bearer secrets. */
export function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/cron/cleanup, run nightly by the schedule in vercel.json.
 * Deletes stored photos with no database row, and old sign-in links and expired sessions.
 * Each job runs even when the other fails.
 */
export function createCleanupRoute(deps: CleanupRouteDeps) {
  return async function GET(request: Request): Promise<Response> {
    if (!deps.secret) return json({ ok: false, error: "Cleanup is not set up." }, 503);
    const header = request.headers.get("authorization") ?? "";
    if (!sameSecret(header, `Bearer ${deps.secret}`)) return json({ ok: false, error: "Not allowed." }, 401);

    const ctx = await deps.context();
    const report: CleanupReport = { ok: true, images: null, auth: null, analytics: null };
    try {
      const { deleted, failed } = await sweepOrphanedImages(ctx);
      report.images = { deleted: deleted.length, failed: failed.length };
      if (failed.length > 0) report.ok = false;
    } catch (error) {
      logError("Sweep orphaned images", error);
      report.ok = false;
    }
    try {
      report.auth = await purgeExpiredAuthRecords(ctx);
    } catch (error) {
      logError("Purge expired sign-in records", error);
      report.ok = false;
    }
    try {
      const removed = await ctx.db.delete(analyticsDedupe).where(lt(analyticsDedupe.expiresAt, new Date())).returning({ key: analyticsDedupe.visitorKey });
      report.analytics = removed.length;
    } catch (error) {
      logError("Purge analytics dedupe keys", error);
      report.ok = false;
    }
    return json(report, report.ok ? 200 : 500);
  };
}
