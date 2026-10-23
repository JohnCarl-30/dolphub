import { NextResponse, type NextRequest } from "next/server";
import { logError } from "./log";
import { safeNextPath, withNext } from "./next-path";
import type { ServiceContext } from "./services/context";
import { ServiceError } from "./services/errors";
import {
  finishGoogleSignIn,
  GOOGLE_ATTEMPT_TTL_MS,
  startGoogleSignIn,
  type GoogleAttempt,
  type GoogleSettings,
} from "./services/google";

/** Reasons the dashboard can show after a failed Google sign-in, sent as ?signin=<reason>. */
export type GoogleSignInProblem = "cancelled" | "expired" | "not-pcu" | "frozen" | "unavailable" | "failed";

export interface GoogleRouteDeps {
  /** Null when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set. */
  settings: () => GoogleSettings | null;
  context: () => Promise<ServiceContext>;
  /** Public origin, the same APP_URL used in emailed links. */
  appUrl: string;
  sessionCookie: string;
  /** __Host- cookies need Secure, so production uses https and local http does not. */
  secure: boolean;
  fetch?: typeof fetch;
}

export function googleAttemptCookie(secure: boolean) {
  return secure ? "__Host-google-signin" : "google-signin";
}

/** The attempt cookie: Google's one-time secrets, plus where to send the student afterwards. */
function readAttempt(raw: string | undefined): { attempt: GoogleAttempt | null; next: string | null } {
  if (!raw) return { attempt: null, next: null };
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    const valid =
      typeof value?.state === "string" && typeof value.nonce === "string" && typeof value.verifier === "string";
    return {
      attempt: valid ? { state: value.state, nonce: value.nonce, verifier: value.verifier } : null,
      next: safeNextPath(value?.next),
    };
  } catch {
    return { attempt: null, next: null };
  }
}

function problemOf(error: unknown): GoogleSignInProblem {
  if (!(error instanceof ServiceError)) return "failed";
  if (error.code === "FORBIDDEN") return "not-pcu";
  if (error.code === "SIGNUPS_FROZEN") return "frozen";
  if (error.code === "UNAVAILABLE") return "unavailable";
  return "expired";
}

/** GET /auth/google and GET /auth/google/callback. */
export function createGoogleRoutes(deps: GoogleRouteDeps) {
  const attemptCookie = googleAttemptCookie(deps.secure);
  const to = (path: string) => new URL(path, deps.appUrl);
  const cookieOptions = { httpOnly: true, secure: deps.secure, sameSite: "lax", path: "/" } as const;
  // Browsers drop a __Host- cookie unless every Set-Cookie for it says Secure, deletions included.
  const clearAttempt = (response: NextResponse) => response.cookies.set(attemptCookie, "", { ...cookieOptions, maxAge: 0 });
  const back = (problem: GoogleSignInProblem, next: string | null = null) => {
    const response = NextResponse.redirect(to(withNext(`/dashboard?signin=${problem}`, next)), 303);
    clearAttempt(response);
    return response;
  };

  /** `rawNext` is the ?next= path to return to after sign-in, such as an opportunity page. */
  async function start(rawNext?: string | null): Promise<NextResponse> {
    const next = safeNextPath(rawNext);
    const settings = deps.settings();
    if (!settings) return back("unavailable", next);
    const { url, attempt } = startGoogleSignIn(settings);
    const response = NextResponse.redirect(url, 303);
    // Lax still sends the cookie on Google's top-level redirect back to us.
    response.cookies.set(attemptCookie, Buffer.from(JSON.stringify({ ...attempt, next })).toString("base64url"), {
      ...cookieOptions,
      maxAge: GOOGLE_ATTEMPT_TTL_MS / 1000,
    });
    return response;
  }

  async function callback(request: NextRequest): Promise<NextResponse> {
    const settings = deps.settings();
    if (!settings) return back("unavailable");
    const params = request.nextUrl.searchParams;
    const { attempt, next } = readAttempt(request.cookies.get(attemptCookie)?.value);
    // The student pressed Cancel on Google's screen, or Google refused.
    if (params.get("error")) return back(params.get("error") === "access_denied" ? "cancelled" : "failed", next);

    try {
      const session = await finishGoogleSignIn(
        await deps.context(),
        settings,
        {
          code: params.get("code") ?? "",
          state: params.get("state") ?? "",
          attempt,
        },
        deps.fetch,
      );
      const response = NextResponse.redirect(to(next ?? "/dashboard"), 303);
      clearAttempt(response);
      response.cookies.set(deps.sessionCookie, session.sessionToken, { ...cookieOptions, expires: session.expiresAt });
      return response;
    } catch (error) {
      if (!(error instanceof ServiceError)) logError("Google sign-in", error);
      return back(problemOf(error), next);
    }
  }

  return { start, callback };
}
