import "server-only";
import { createHash } from "node:crypto";
import { loadConfig, type Config } from "./config";
import type { Db } from "./db";
import { createNeonDb } from "./db/neon";
import { ConsoleEmailSender } from "./email/dev";
import { ResendEmailSender } from "./email/resend";
import type { EmailSender } from "./email/types";
import type { AuthSettings } from "./services/auth";
import type { GoogleSettings } from "./services/google";
import type { ServiceContext } from "./services/context";
import { MemoryStorage } from "./storage/memory";
import { R2Storage } from "./storage/r2";

let config: Config | undefined;
let context: Promise<ServiceContext> | undefined;
let emailSender: EmailSender | undefined;

export function getConfig(): Config {
  config ??= loadConfig();
  return config;
}

async function createDb(c: Config): Promise<Db> {
  if (c.DATABASE_URL.startsWith("pglite:")) {
    const { createLocalDb } = await import("./db/local");
    return createLocalDb(c.DATABASE_URL.slice("pglite:".length));
  }
  return createNeonDb(c.DATABASE_URL);
}

/**
 * The service context: Neon and R2 in production. Locally, without those
 * accounts, a PGlite folder and in-memory image storage.
 * Only server code may import this file.
 */
export function getServiceContext(): Promise<ServiceContext> {
  context ??= (async () => {
    const c = getConfig();
    const storage =
      c.R2_ACCOUNT_ID && c.R2_ACCESS_KEY_ID && c.R2_SECRET_ACCESS_KEY && c.R2_BUCKET && c.R2_PUBLIC_BASE_URL
        ? new R2Storage({
            accountId: c.R2_ACCOUNT_ID,
            accessKeyId: c.R2_ACCESS_KEY_ID,
            secretAccessKey: c.R2_SECRET_ACCESS_KEY,
            bucket: c.R2_BUCKET,
            publicBaseUrl: c.R2_PUBLIC_BASE_URL,
          })
        : new MemoryStorage(`${c.APP_URL}/dev-images`);
    return { db: await createDb(c), storage };
  })();
  return context;
}

/** Resend when RESEND_API_KEY is set. Otherwise links are printed to the server log. */
export function getEmailSender(): EmailSender {
  if (!emailSender) {
    const c = getConfig();
    emailSender = c.RESEND_API_KEY
      ? new ResendEmailSender(c.RESEND_API_KEY, c.EMAIL_FROM)
      : new ConsoleEmailSender();
  }
  return emailSender;
}

export function getAuthSettings(): AuthSettings {
  const c = getConfig();
  return {
    allowedDomains: c.PCU_EMAIL_DOMAINS,
    appUrl: c.APP_URL,
    dailyEmailCap: c.DAILY_EMAIL_CAP,
    linksPerNetworkPerHour: c.SIGNIN_LINKS_PER_NETWORK_PER_HOUR,
    // DATABASE_URL is secret and present everywhere, so it makes a safe fallback key.
    rateLimitKey:
      c.RATE_LIMIT_SECRET ??
      createHash("sha256").update(`dolphub-rate-limit:${c.DATABASE_URL}`).digest("hex"),
  };
}

/** Settings for "Continue with Google", or null when the OAuth client is not configured. */
export function getGoogleSettings(): GoogleSettings | null {
  const c = getConfig();
  if (!c.GOOGLE_CLIENT_ID || !c.GOOGLE_CLIENT_SECRET) return null;
  return {
    clientId: c.GOOGLE_CLIENT_ID,
    clientSecret: c.GOOGLE_CLIENT_SECRET,
    redirectUri: `${c.APP_URL}/auth/google/callback`,
    allowedDomains: c.PCU_EMAIL_DOMAINS,
  };
}

