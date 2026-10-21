import { connection } from "next/server";
import { getServiceContext } from "@/lib/server";
import { MemoryStorage } from "@/lib/storage/memory";

/**
 * Serves uploaded photos when R2 is not configured, in local development and
 * browser tests. They live in server memory and vanish on restart.
 * With R2 set up, photos load from R2 and this route answers 404.
 */
export async function GET(_request: Request, { params }: RouteContext<"/dev-images/[...key]">) {
  await connection();
  const { storage } = await getServiceContext();
  const { key } = await params;
  const object = storage instanceof MemoryStorage ? storage.objects.get(key.join("/")) : undefined;
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body as BodyInit, {
    headers: { "Content-Type": object.contentType, "Cache-Control": "no-store" },
  });
}
