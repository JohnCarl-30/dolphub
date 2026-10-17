import "server-only";
import { loadConfig, type Config } from "./config";
import type { Db } from "./db";
import { createNeonDb } from "./db/neon";
import { ConsoleEmailSender } from "./email/dev";
import { ResendEmailSender } from "./email/resend";
import type { EmailSender } from "./email/types";
import type { AuthSettings } from "./services/auth";
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
  };
}
