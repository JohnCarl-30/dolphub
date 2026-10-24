export type ServiceErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "LIMIT_REACHED"
  | "SIGNUPS_FROZEN"
  | "UNAVAILABLE";

/**
 * The only error type services throw on purpose. Callers map `code`
 * to an HTTP status or a form message. `message` is safe to show users.
 */
export class ServiceError extends Error {
  constructor(
    readonly code: ServiceErrorCode,
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

/** True when a database error, or anything it wraps, is a unique-key violation. */
export function isUniqueViolation(error: unknown): boolean {
  let e: unknown = error;
  for (let depth = 0; e && depth < 5; depth++) {
    if (typeof e === "object" && "code" in e && (e as { code: unknown }).code === "23505") {
      return true;
    }
    e = typeof e === "object" && "cause" in e ? (e as { cause: unknown }).cause : undefined;
  }
  return false;
}

/**
 * True when a deployment is reading an optional table whose migration has not
 * reached the database yet. Drizzle wraps the Postgres error in `cause`.
 *
 * Keep the relation name check: a missing core table is not safe to hide.
 */
export function isMissingRelation(error: unknown, relation: string): boolean {
  let e: unknown = error;
  for (let depth = 0; e && depth < 5; depth++) {
    if (typeof e === "object") {
      const record = e as { code?: unknown; message?: unknown; cause?: unknown };
      if (
        record.code === "42P01" &&
        typeof record.message === "string" &&
        record.message.toLowerCase().includes(relation.toLowerCase())
      ) {
        return true;
      }
      e = record.cause;
      continue;
    }
    break;
  }
  return false;
}
