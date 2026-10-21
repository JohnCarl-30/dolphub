import { connection } from "next/server";
import { createCleanupRoute } from "@/lib/cleanup-route";
import { getConfig, getServiceContext } from "@/lib/server";

let handler: ReturnType<typeof createCleanupRoute> | undefined;

/** Nightly cleanup, scheduled in vercel.json. See lib/cleanup-route.ts. */
export async function GET(request: Request) {
  await connection();
  // Built on first request, so a build without environment variables still succeeds.
  handler ??= createCleanupRoute({ context: getServiceContext, secret: getConfig().CRON_SECRET });
  return handler(request);
}
