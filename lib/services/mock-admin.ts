import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { startSession, type NewSession } from "./auth";
import type { ServiceContext } from "./context";
import { ServiceError } from "./errors";

/**
 * A fixed admin login for local development only, so the admin screens can
 * be tried without an email link. The caller must check `mockAdminEnabled`
 * first: these credentials are public, so they must never work on the live site.
 */
export const MOCK_ADMIN = { email: "admin@pcu.edu.ph", password: "password" } as const;

/** True only for `npm run dev` against the local pglite database. Never in a production build. */
export function mockAdminEnabled(env: { NODE_ENV?: string; DATABASE_URL?: string }): boolean {
  return env.NODE_ENV !== "production" && (env.DATABASE_URL ?? "").startsWith("pglite:");
}

/** Signs in as the mock admin, creating the account the first time. */
export async function signInMockAdmin(
  ctx: ServiceContext,
  input: { email: string; password: string },
): Promise<NewSession> {
  if (input.email.trim().toLowerCase() !== MOCK_ADMIN.email || input.password !== MOCK_ADMIN.password) {
    throw new ServiceError("VALIDATION", "Wrong email or password");
  }
  await ctx.db
    .insert(users)
    .values({ email: MOCK_ADMIN.email, isAdmin: true })
    .onConflictDoUpdate({ target: users.email, set: { isAdmin: true, deletedAt: null } });
  const [user] = await ctx.db
    .select({ id: users.id, email: users.email, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.email, MOCK_ADMIN.email));
  return startSession(ctx, user!);
}
