import "server-only";
import { headers } from "next/headers";

/**
 * The visitor's IP address, as reported by the hosting platform.
 * Vercel sets x-forwarded-for itself and overwrites any value the client sends,
 * so it can be trusted there. On another host, check how it sets the header.
 * Use it only for rate limiting, never store or log it raw.
 */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || null;
}
