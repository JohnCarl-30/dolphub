import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { getSessionUser, type SessionUser } from "./services/auth";
import { getServiceContext } from "./server";

const isProduction = process.env.NODE_ENV === "production";

/**
 * __Host- cookies must be Secure, have Path=/ and no Domain, so no subdomain
 * can overwrite them. Local http development uses a plain name.
 */
export const SESSION_COOKIE = isProduction ? "__Host-session" : "session";

export async function readSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** The signed-in user, or null. Read once per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  // Read the cookie first. It marks the render as request-time, and with no
  // cookie there is no need to touch the database at all.
  const token = await readSessionToken();
  if (!token) return null;
  // The lookup checks expiry against the current time, so it must run per request.
  await connection();
  return getSessionUser(await getServiceContext(), token);
});

/** The signed-in user, or a redirect to /login. Call it in every protected page and action. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Only from a server action or route handler. */
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Only from a server action or route handler. */
export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
