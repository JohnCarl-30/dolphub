import { eq, sql } from "drizzle-orm";
import type { Db } from "../db";
import { appSettings } from "../db/schema";

export async function getSignupsFrozen(db: Db): Promise<boolean> {
  const [row] = await db
    .select({ frozen: appSettings.signupsFrozen })
    .from(appSettings)
    .where(eq(appSettings.id, 1));
  return row?.frozen ?? false;
}

/** Low-level write. Admin callers should use setSignupsFrozen in admin.ts, which logs it. */
export async function writeSignupsFrozen(db: Db, frozen: boolean): Promise<void> {
  await db
    .insert(appSettings)
    .values({ id: 1, signupsFrozen: frozen })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { signupsFrozen: frozen, updatedAt: sql`now()` },
    });
}
