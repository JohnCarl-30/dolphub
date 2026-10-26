import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getServiceContext } from "@/lib/server";

/** For the uptime monitor: 200 when the site can reach Neon, 503 when it can't. */
export async function GET() {
  await connection();
  const headers = { "cache-control": "no-store" };
  try {
    await (await getServiceContext()).db.execute(sql`select 1`);
    return Response.json({ ok: true }, { headers });
  } catch (error) {
    console.error("Health check: database unreachable", error);
    return Response.json({ ok: false }, { status: 503, headers });
  }
}
