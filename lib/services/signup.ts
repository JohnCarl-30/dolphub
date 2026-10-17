import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../db";
import { users } from "../db/schema";
import { ServiceError } from "./errors";
import { getSignupsFrozen } from "./settings";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * True when the address belongs to one of the allowed PCU domains.
 * The domain must match exactly, so "x@evilpcu.edu.ph" fails for "pcu.edu.ph".
 */
export function isAllowedSignupEmail(email: string, allowedDomains: string[]): boolean {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return false;
  const domain = normalized.slice(at + 1);
  return allowedDomains.some((d) => d.trim().toLowerCase() === domain);
}

export interface SignedInUser {
  id: string;
  email: string;
  isAdmin: boolean;
  isNew: boolean;
}

/**
 * Called when someone completes a magic-link sign-in.
 * Existing users always get in. New users need an allowed domain and open signups.
 */
export async function signInOrRegister(
  db: Db,
  email: string,
  allowedDomains: string[],
): Promise<SignedInUser> {
  const normalized = normalizeEmail(email);

  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, normalized), isNull(users.deletedAt)));
  if (existing) {
    return { id: existing.id, email: existing.email, isAdmin: existing.isAdmin, isNew: false };
  }

  if (!isAllowedSignupEmail(normalized, allowedDomains)) {
    throw new ServiceError("FORBIDDEN", "Sign up with your PCU email address", "email");
  }
  if (await getSignupsFrozen(db)) {
    throw new ServiceError("SIGNUPS_FROZEN", "New signups are paused. Please try again later.");
  }

  const [created] = await db
    .insert(users)
    .values({ email: normalized })
    .onConflictDoNothing({ target: users.email })
    .returning();
  if (created) {
    return { id: created.id, email: created.email, isAdmin: created.isAdmin, isNew: true };
  }

  // Another request created the same user a moment ago, or a deletion is in progress.
  const [raced] = await db.select().from(users).where(eq(users.email, normalized));
  if (!raced || raced.deletedAt) {
    throw new ServiceError("CONFLICT", "This account is being deleted. Try again in a minute.");
  }
  return { id: raced.id, email: raced.email, isAdmin: raced.isAdmin, isNew: false };
}
