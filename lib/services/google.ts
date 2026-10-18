import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { logError } from "../log";
import { startSession, type NewSession } from "./auth";
import type { ServiceContext } from "./context";
import { nowOf } from "./context";
import { ServiceError } from "./errors";
import { signInOrRegister } from "./signup";

export const GOOGLE_ENDPOINTS = {
  authorize: "https://accounts.google.com/o/oauth2/v2/auth",
  token: "https://oauth2.googleapis.com/token",
};

/** How long a started Google sign-in may take before it must start again. */
export const GOOGLE_ATTEMPT_TTL_MS = 10 * 60 * 1000;

export interface GoogleSettings {
  clientId: string;
  clientSecret: string;
  /** APP_URL + /auth/google/callback. Must match the OAuth client in Google Cloud exactly. */
  redirectUri: string;
  allowedDomains: string[];
}

/** What the browser keeps in a short-lived cookie between leaving for Google and coming back. */
export interface GoogleAttempt {
  state: string;
  nonce: string;
  verifier: string;
}

const random = () => randomBytes(32).toString("base64url");

/**
 * The Google consent URL and the secrets to check when Google sends the
 * student back. Uses PKCE, a state value against forged callbacks, and a
 * nonce against replayed ID tokens.
 */
export function startGoogleSignIn(settings: GoogleSettings): { url: string; attempt: GoogleAttempt } {
  const attempt: GoogleAttempt = { state: random(), nonce: random(), verifier: random() };
  const url = new URL(GOOGLE_ENDPOINTS.authorize);
  url.search = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: settings.redirectUri,
    response_type: "code",
    scope: "openid email",
    state: attempt.state,
    nonce: attempt.nonce,
    code_challenge: createHash("sha256").update(attempt.verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
    // Only a hint for Google's account chooser. The domain check below is the real gate.
    ...(settings.allowedDomains.length === 1 ? { hd: settings.allowedDomains[0]! } : {}),
  }).toString();
  return { url: url.toString(), attempt };
}

const tokenResponseSchema = z.object({ id_token: z.string().min(1) });

const idTokenSchema = z.object({
  iss: z.enum(["https://accounts.google.com", "accounts.google.com"]),
  aud: z.string(),
  exp: z.number(),
  nonce: z.string().optional(),
  email: z.email(),
  email_verified: z.boolean(),
});

function decodeIdToken(idToken: string): unknown {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

const expired = () =>
  new ServiceError("VALIDATION", "This Google sign-in has expired. Please try again.", "state");

/**
 * Finishes a Google sign-in: trades the code for an ID token, checks it, then
 * signs in or registers the address under the same rules as email links.
 *
 * The ID token comes straight from Google's token endpoint over TLS, as the
 * reply to a request signed with the client secret, so OpenID Connect allows
 * trusting it without checking its signature. Its claims are still checked.
 */
export async function finishGoogleSignIn(
  ctx: ServiceContext,
  settings: GoogleSettings,
  input: { code: string; state: string; attempt: GoogleAttempt | null },
  fetchImpl: typeof fetch = fetch,
): Promise<NewSession> {
  const { attempt } = input;
  if (!attempt || !input.code || !input.state || input.state !== attempt.state) throw expired();

  let response: Response;
  try {
    response = await fetchImpl(GOOGLE_ENDPOINTS.token, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: input.code,
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
        redirect_uri: settings.redirectUri,
        grant_type: "authorization_code",
        code_verifier: attempt.verifier,
      }),
    });
  } catch (error) {
    logError("Google token request", error);
    throw new ServiceError("UNAVAILABLE", "Google did not respond. Please try again.");
  }
  if (!response.ok) {
    // A used or expired code lands here, which is the same as an expired attempt to the student.
    logError("Google token request", new Error(`Google answered ${response.status}`));
    throw expired();
  }

  const body = tokenResponseSchema.safeParse(await response.json().catch(() => null));
  const claims = body.success ? idTokenSchema.safeParse(decodeIdToken(body.data.id_token)) : null;
  if (!claims?.success) throw new ServiceError("UNAVAILABLE", "Google sent an answer we could not read. Please try again.");
  const token = claims.data;
  if (
    token.aud !== settings.clientId ||
    token.nonce !== attempt.nonce ||
    token.exp * 1000 <= nowOf(ctx).getTime()
  ) {
    throw expired();
  }
  if (!token.email_verified) {
    throw new ServiceError("FORBIDDEN", "Google has not verified this email address.", "email");
  }

  const user = await signInOrRegister(ctx.db, token.email, settings.allowedDomains);
  return startSession(ctx, user);
}
