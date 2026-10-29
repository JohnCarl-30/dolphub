import { createHash, createHmac } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getAuthSettings, getServiceContext } from "@/lib/server";
import { classifyViewSource, recordProfileView } from "@/lib/services/analytics";

const bots = /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp/i;
export async function POST(request: Request) {
  try {
    const data = await request.json() as { handle?: unknown; ref?: unknown };
    if (typeof data.handle !== "string" || !/^[a-z0-9-]{2,30}$/.test(data.handle)) return new Response(null, { status: 204 });
    const ua = request.headers.get("user-agent") ?? "";
    if (!ua || bots.test(ua)) return new Response(null, { status: 204 });
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const day = new Date().toISOString().slice(0, 10);
    const secret = getAuthSettings().rateLimitKey ?? createHash("sha256").update(process.env.DATABASE_URL ?? "dolphub").digest("hex");
    const key = createHmac("sha256", secret).update(`${day}:${forwarded}:${ua}`).digest("hex");
    const user = await getCurrentUser();
    const ref = typeof data.ref === "string" ? data.ref : null;
    const origin = new URL(request.url).origin;
    await recordProfileView((await getServiceContext()).db, data.handle, user?.id ?? null, key, classifyViewSource(ref, request.headers.get("referer"), origin));
  } catch {
    // Analytics is best effort and must never affect a public page.
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
