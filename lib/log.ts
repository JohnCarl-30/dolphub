/*
 * Error logging without personal data. Student email addresses must never
 * reach the server logs (Vercel keeps them, and anyone with project access
 * can read them).
 *
 * Two ways an email could leak into a log:
 * - Drizzle's query errors put every query value in the message and stack,
 *   as a "params: ..." line. Sign-in queries pass the email as a value.
 * - Outside services, such as Resend, can echo the recipient in their
 *   error text.
 *
 * So never pass an error object straight to console. Use logError.
 */

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi;
const PARAMS_LINE = /^params:.*$/gm;

/** Masks email addresses and drops Drizzle's query values. */
export function redact(text: string): string {
  return text.replace(PARAMS_LINE, "params: [redacted]").replace(EMAIL, "[email]");
}

export interface SafeError {
  name: string;
  message: string;
  /** Postgres error code, such as 23505, when the database raised it. */
  code?: string;
  stack?: string;
  cause?: SafeError;
}

/** A log-safe copy of an error and its causes. */
export function describeError(error: unknown, depth = 0): SafeError {
  if (!(error instanceof Error)) {
    return { name: typeof error, message: redact(String(error)).slice(0, 300) };
  }
  const code = (error as { code?: unknown }).code;
  const safe: SafeError = {
    name: error.name,
    message: redact(error.message).slice(0, 500),
    ...(typeof code === "string" || typeof code === "number" ? { code: String(code) } : {}),
    ...(error.stack ? { stack: redact(error.stack).split("\n").slice(0, 8).join("\n") } : {}),
  };
  const cause = (error as { cause?: unknown }).cause;
  if (cause !== undefined && depth < 3) safe.cause = describeError(cause, depth + 1);
  return safe;
}

/** Logs an unexpected failure with personal data removed. */
export function logError(context: string, error: unknown): void {
  console.error(`${context} failed`, describeError(error));
}
