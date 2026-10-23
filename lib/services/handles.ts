import { ServiceError } from "./errors";

/** 3 to 30 characters: lowercase letters, digits, "-" and "_", starting and ending with a letter or digit. */
const HANDLE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

/** Route names, system words, and names that could pass as official. */
export const RESERVED_HANDLES = new Set([
  "about", "account", "admin", "administrator", "api", "app", "auth", "blog",
  "dashboard", "edit", "help", "home", "internships", "login", "logout", "mail",
  "mcp", "me", "moderator", "new", "null", "official", "pcu", "privacy",
  "profile", "register", "report", "root", "search", "settings", "signin",
  "signup", "static", "support", "system", "terms", "u", "undefined", "user",
  "users", "www",
]);

/** Fragments that suggest a page speaks for the platform or the university. */
const RESERVED_FRAGMENTS = ["admin", "official", "moderator"];

export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Returns the normalized handle, or throws a VALIDATION error explaining why not. */
export function validateHandle(raw: string): string {
  const handle = normalizeHandle(raw);
  if (!HANDLE_PATTERN.test(handle)) {
    throw new ServiceError(
      "VALIDATION",
      "Use 3 to 30 lowercase letters, numbers, - or _, starting and ending with a letter or number",
      "handle",
    );
  }
  if (
    RESERVED_HANDLES.has(handle) ||
    handle.startsWith("pcu") ||
    RESERVED_FRAGMENTS.some((f) => handle.includes(f))
  ) {
    throw new ServiceError("VALIDATION", "That handle is reserved", "handle");
  }
  return handle;
}

/**
 * Turns what a student typed, often their name, into a handle that passes
 * validateHandle: "Juan Dela Cruz" becomes "juan-dela-cruz" and "Ñiño" becomes
 * "nino". Null when nothing usable is left or the result is reserved.
 */
export function suggestHandle(raw: string): string | null {
  const candidate = raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^[-_]+/, "")
    .slice(0, 30)
    .replace(/[-_]+$/, "");
  try {
    return validateHandle(candidate);
  } catch {
    return null;
  }
}
