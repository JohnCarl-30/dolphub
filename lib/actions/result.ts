import { ServiceError } from "../services/errors";

/**
 * What every server action returns. On failure, `error` is safe to show
 * the user, and `field` names the form field it belongs to, if any.
 */
export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/** Expected problems become messages. Anything else is logged and hidden from the user. */
export function toActionError(error: unknown, context: string): ActionResult<never> {
  if (error instanceof ServiceError) {
    return error.field
      ? { ok: false, error: error.message, field: error.field }
      : { ok: false, error: error.message };
  }
  console.error(`${context} failed`, error);
  return { ok: false, error: "Something went wrong. Please try again." };
}
