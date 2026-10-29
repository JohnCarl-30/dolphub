import { getCurrentUser } from "@/lib/auth";
import { getServiceContext } from "@/lib/server";
import { recordProfileLinkClick, recordProjectClick } from "@/lib/services/analytics";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { kind?: unknown; targetId?: unknown };
    if (typeof body.targetId !== "string" || body.targetId.length > 40) return new Response(null, { status: 204 });
    const user = await getCurrentUser();
    const db = (await getServiceContext()).db;
    if (body.kind === "demo" || body.kind === "source") await recordProjectClick(db, body.targetId, body.kind, user?.id ?? null);
    if (body.kind === "github" || body.kind === "messenger" || body.kind === "email") await recordProfileLinkClick(db, body.targetId, body.kind, user?.id ?? null);
  } catch { /* best effort */ }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
