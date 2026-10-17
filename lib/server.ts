import "server-only";
import { loadConfig, type Config } from "./config";
import { createNeonDb } from "./db/neon";
import type { ServiceContext } from "./services/context";
import { R2Storage } from "./storage/r2";

let config: Config | undefined;
let context: ServiceContext | undefined;

export function getConfig(): Config {
  config ??= loadConfig();
  return config;
}

/**
 * The production service context: Neon over HTTP and Cloudflare R2.
 * Built once per server instance. Only server code may import this file.
 */
export function getServiceContext(): ServiceContext {
  if (!context) {
    const c = getConfig();
    context = {
      db: createNeonDb(c.DATABASE_URL),
      storage: new R2Storage({
        accountId: c.R2_ACCOUNT_ID,
        accessKeyId: c.R2_ACCESS_KEY_ID,
        secretAccessKey: c.R2_SECRET_ACCESS_KEY,
        bucket: c.R2_BUCKET,
        publicBaseUrl: c.R2_PUBLIC_BASE_URL,
      }),
    };
  }
  return context;
}
