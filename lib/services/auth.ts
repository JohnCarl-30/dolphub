import { createHash, createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { and, count, eq, gt, gte, isNull, lt } from "drizzle-orm";
import { z } from "zod";
import { loginTokens, sessions, users } from "../db/schema";
import type { EmailSender } from "../email/types";
import { logError } from "../log";
import { nowOf, type ServiceContext } from "./context";
import { ServiceError } from "./errors";
import { assertCanRegister, findActiveUserByEmail, normalizeEmail, signInOrRegister } from "./signup";

export const AUTH_LIMITS = {
  linkTtlMs: 15 * 60 * 1000,
  sessionTtlMs: 30 * 24 * 60 * 60 * 1000,
  /** Links one address may request per window. */
  linksPerEmail: 3,
  linkWindowMs: 15 * 60 * 1000,
  /** Default rolling 24-hour cap. Resend's free tier allows 100 emails a day. */
  defaultDailyEmailCap: 90,
  /**
   * Default links per network per hour. Campus Wi-Fi puts a whole classroom
   * behind one address, so this must allow a group sign-up session.
   */
  defaultLinksPerNetworkPerHour: 30,
};

export interface AuthSettings {
  allowedDomains: string[];
  /** Site origin used in emailed links, such as https://dolphub.tech */
  appUrl: string;
  dailyEmailCap?: number;
  /** Links one network may request per hour. */
  linksPerNetworkPerHour?: number;
  /** Secret for hashing networks. Without it, the per-network limit is off. */
  rateLimitKey?: string;
}

/**
 * The part of an IP address that identifies a network. IPv4 addresses are
 * used whole. IPv6 addresses are cut to their /64 prefix, because one device
 * can rotate through many addresses inside it. Returns null for anything
 * that is not an IP address.
 */
export function networkOf(rawIp: string | null | undefined): string | null {
  const ip = rawIp?.trim();
  if (!ip) return null;
  const mapped = ip.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return mapped[1]!;
  const version = isIP(ip);
  if (version === 4) return ip;
  if (version !== 6) return null;
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const groups = ip.includes("::")
    ? [...headParts, ...Array(8 - headParts.length - tailParts.length).fill("0"), ...tailParts]
    : headParts;
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

/** Keyed hash of a network, so the stored value cannot be turned back into an address. */
export function hashNetwork(network: string, key: string): string {
  return createHmac("sha256", key).update(network).digest("hex");
}

const DAY_MS = 24 * 60 * 60 * 1000;
const emailSchema = z.email("Enter a valid email address");

/** Random, URL-safe, 256-bit token. */
function newToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Tokens are long and random, so a plain SHA-256 is enough to keep them unusable if the database leaks. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function signInEmail(link: string) {
  const minutes = AUTH_LIMITS.linkTtlMs / 60_000;
  return {
    subject: "Your PCU Community sign-in link",
    text: [
      "Open this link to sign in to PCU Community:",
      "",
      link,
      "",
      `It works once and expires in ${minutes} minutes.`,
      "If you did not ask for this, you can ignore this email.",
    ].join("\n"),
    html: `<p>Tap the button to sign in to PCU Community.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;border-radius:8px;text-decoration:none">Sign in</a></p>
<p>Or paste this link into your browser:<br>${link}</p>
<p>It works once and expires in ${minutes} minutes. If you did not ask for this, you can ignore this email.</p>`,
  };
}

/**
 * Emails a one-time sign-in link.
 * Existing users can always ask. New addresses must be allowed to register.
 * Limits: a few links per address per 15 minutes, and a site-wide daily cap
 * that keeps the site under Resend's free-tier limit.
 */
export async function requestSignInLink(
  ctx: ServiceContext,
  sender: EmailSender,
  settings: AuthSettings,
  rawEmail: string,
  /** The requester's IP address, as set by the hosting platform. Optional. */
  clientIp?: string | null,
): Promise<{ email: string }> {
  const parsed = emailSchema.safeParse(normalizeEmail(rawEmail));
  if (!parsed.success) throw new ServiceError("VALIDATION", "Enter a valid email address", "email");
  const email = parsed.data;
  const now = nowOf(ctx);

  if (!(await findActiveUserByEmail(ctx.db, email))) {
    await assertCanRegister(ctx.db, email, settings.allowedDomains);
  }

  const [[recentForEmail], [lastDay]] = await Promise.all([
    ctx.db
      .select({ n: count() })
      .from(loginTokens)
      .where(
        and(
          eq(loginTokens.email, email),
          gte(loginTokens.createdAt, new Date(now.getTime() - AUTH_LIMITS.linkWindowMs)),
        ),
      ),
    ctx.db
      .select({ n: count() })
      .from(loginTokens)
      .where(gte(loginTokens.createdAt, new Date(now.getTime() - DAY_MS))),
  ]);
  if (Number(recentForEmail!.n) >= AUTH_LIMITS.linksPerEmail) {
    throw new ServiceError(
      "LIMIT_REACHED",
      "Too many sign-in emails for this address. Check your inbox and spam folder, or wait 15 minutes.",
      "email",
    );
  }
  const network = settings.rateLimitKey ? networkOf(clientIp) : null;
  const requesterHash = network ? hashNetwork(network, settings.rateLimitKey!) : null;
  if (requesterHash) {
    const [fromNetwork] = await ctx.db
      .select({ n: count() })
      .from(loginTokens)
      .where(
        and(
          eq(loginTokens.requesterHash, requesterHash),
          gte(loginTokens.createdAt, new Date(now.getTime() - 60 * 60 * 1000)),
        ),
      );
    const limit = settings.linksPerNetworkPerHour ?? AUTH_LIMITS.defaultLinksPerNetworkPerHour;
    if (Number(fromNetwork!.n) >= limit) {
      throw new ServiceError(
        "LIMIT_REACHED",
        "Too many sign-in requests from this network. Please try again in an hour.",
      );
    }
  }
  if (Number(lastDay!.n) >= (settings.dailyEmailCap ?? AUTH_LIMITS.defaultDailyEmailCap)) {
    throw new ServiceError(
      "LIMIT_REACHED",
      "Sign-in is very busy today. Please try again tomorrow.",
    );
  }

  const token = newToken();
  const [row] = await ctx.db
    .insert(loginTokens)
    .values({
      email,
      tokenHash: hashToken(token),
      expiresAt: new Date(now.getTime() + AUTH_LIMITS.linkTtlMs),
      requesterHash,
      createdAt: now,
    })
    .returning({ id: loginTokens.id });

  const link = `${settings.appUrl.replace(/\/+$/, "")}/auth/verify?token=${token}`;
  try {
    await sender.send({ to: email, ...signInEmail(link) });
  } catch (error) {
    await ctx.db.delete(loginTokens).where(eq(loginTokens.id, row!.id));
    logError("Sign-in email", error);
    throw new ServiceError("UNAVAILABLE", "We could not send the email. Please try again in a few minutes.");
  }
  return { email };
}

export interface SessionUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Uses a sign-in link and starts a session. Each link works once: the
 * update that marks it used succeeds for exactly one request.
 * Returns the session token for the cookie. Only its hash is stored.
 */
export async function consumeSignInLink(
  ctx: ServiceContext,
  settings: Pick<AuthSettings, "allowedDomains">,
  token: string,
): Promise<NewSession> {
  const now = nowOf(ctx);
  const [link] = token
    ? await ctx.db
        .update(loginTokens)
        .set({ usedAt: now })
        .where(
          and(
            eq(loginTokens.tokenHash, hashToken(token)),
            isNull(loginTokens.usedAt),
            gt(loginTokens.expiresAt, now),
          ),
        )
        .returning({ email: loginTokens.email })
    : [];
  if (!link) {
    throw new ServiceError(
      "VALIDATION",
      "This sign-in link has expired or was already used. Request a new one.",
      "token",
    );
  }

  const user = await signInOrRegister(ctx.db, link.email, settings.allowedDomains);
  return startSession(ctx, user);
}

export interface NewSession {
  sessionToken: string;
  expiresAt: Date;
  user: SessionUser;
}

/** Starts a 30-day session for a user who has proved they own their address. Only the token hash is stored. */
export async function startSession(ctx: ServiceContext, user: SessionUser): Promise<NewSession> {
  const now = nowOf(ctx);
  const sessionToken = newToken();
  const expiresAt = new Date(now.getTime() + AUTH_LIMITS.sessionTtlMs);
  await ctx.db.insert(sessions).values({
    userId: user.id,
    tokenHash: hashToken(sessionToken),
    expiresAt,
    createdAt: now,
  });
  return { sessionToken, expiresAt, user: { id: user.id, email: user.email, isAdmin: user.isAdmin } };
}

/** The user behind a session cookie, or null if it is missing, expired, or the account is being deleted. */
export async function getSessionUser(
  ctx: ServiceContext,
  sessionToken: string | undefined,
): Promise<SessionUser | null> {
  if (!sessionToken) return null;
  const [row] = await ctx.db
    .select({ id: users.id, email: users.email, isAdmin: users.isAdmin })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(sessionToken)),
        gt(sessions.expiresAt, nowOf(ctx)),
        isNull(users.deletedAt),
      ),
    );
  return row ?? null;
}

export async function signOut(ctx: ServiceContext, sessionToken: string | undefined): Promise<void> {
  if (!sessionToken) return;
  await ctx.db.delete(sessions).where(eq(sessions.tokenHash, hashToken(sessionToken)));
}

/**
 * Nightly cleanup. Keeps two days of sign-in links, because the daily cap
 * counts the last 24 hours. Drops expired sessions.
 */
export async function purgeExpiredAuthRecords(ctx: ServiceContext) {
  const now = nowOf(ctx);
  const tokens = await ctx.db
    .delete(loginTokens)
    .where(lt(loginTokens.createdAt, new Date(now.getTime() - 2 * DAY_MS)))
    .returning({ id: loginTokens.id });
  const expired = await ctx.db
    .delete(sessions)
    .where(lt(sessions.expiresAt, now))
    .returning({ id: sessions.id });
  return { loginTokens: tokens.length, sessions: expired.length };
}
