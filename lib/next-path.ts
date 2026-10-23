/*
 * Where to send a student after sign-in, carried as ?next=<path> through the
 * Google and email sign-in flows. Only plain paths on this site are allowed,
 * so a crafted link cannot bounce a student to another site after sign-in.
 */

/** A path such as /opportunities/acme-intern-a1b2: no scheme, host, query or "//". */
const NEXT_PATH = /^\/(?![/\\])[A-Za-z0-9._~/-]{0,199}$/;

/** The path to return to, or null when `raw` is missing or not a safe same-site path. */
export function safeNextPath(raw: unknown): string | null {
  return typeof raw === "string" && NEXT_PATH.test(raw) ? raw : null;
}

/** Adds ?next=<path> to a sign-in URL. Leaves the URL alone when there is nowhere to return to. */
export function withNext(url: string, next: string | null): string {
  if (!next) return url;
  return `${url}${url.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}`;
}
