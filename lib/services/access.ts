import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { adminAuditLog, users } from "../db/schema";
import { ServiceError } from "./errors";

/** Throws FORBIDDEN unless the user is an active admin. */
export async function requireAdmin(db: Db, actorUserId: string): Promise<void> {
  const parsed = z.uuid().safeParse(actorUserId);
  const [actor] = parsed.success
    ? await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, parsed.data), eq(users.isAdmin, true), isNull(users.deletedAt)))
    : [];
  if (!actor) throw new ServiceError("FORBIDDEN", "Admins only");
}

/** Records an admin write. Targets are ids, never names. */
export async function audit(
  db: Db,
  entry: { actorUserId: string | null; action: string; target: string; reason?: string | null },
) {
  await db.insert(adminAuditLog).values({ ...entry, reason: entry.reason ?? null });
}
