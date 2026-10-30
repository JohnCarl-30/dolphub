import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, PCU_DOMAINS, type TestEnv } from "../test/helpers";
import { getSessionUser } from "./auth";
import type { ServiceContext } from "./context";
import { finishGoogleSignIn, GOOGLE_ENDPOINTS, startGoogleSignIn, type GoogleSettings } from "./google";
import { writeSignupsFrozen } from "./settings";

const settings: GoogleSettings = {
  clientId: "client-123.apps.googleusercontent.com",
  clientSecret: "secret",
  redirectUri: "https://dolphub.tech/auth/google/callback",
  allowedDomains: PCU_DOMAINS,
};

const NOW = new Date("2026-10-20T08:00:00Z");

/** An unsigned JWT. The service trusts the TLS channel, not the signature. */
function idToken(claims: Record<string, unknown>) {
  const part = (v: object) => Buffer.from(JSON.stringify(v)).toString("base64url");
  return `${part({ alg: "RS256" })}.${part(claims)}.signature`;
}

/** A stand-in for Google's token endpoint that records what it was sent. */
function fakeGoogle(claims: Record<string, unknown> | null, status = 200) {
  const calls: URLSearchParams[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    expect(url).toBe(GOOGLE_ENDPOINTS.token);
    calls.push(new URLSearchParams(init.body as URLSearchParams));
    return new Response(JSON.stringify(claims ? { id_token: idToken(claims) } : { error: "invalid_grant" }), { status });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("Google sign-in", () => {
  let env: TestEnv;
  let ctx: ServiceContext;
  let attempt: ReturnType<typeof startGoogleSignIn>["attempt"];
  let claims: Record<string, unknown>;

  beforeEach(async () => {
    env = await createTestContext();
    ctx = { ...env.ctx, now: () => NOW };
    attempt = startGoogleSignIn(settings).attempt;
    claims = {
      iss: "https://accounts.google.com",
      aud: settings.clientId,
      exp: NOW.getTime() / 1000 + 3600,
      nonce: attempt.nonce,
      email: "Mira.Santos@pcu.edu.ph",
      email_verified: true,
      hd: "pcu.edu.ph",
    };
  });

  const finish = (fetchImpl: typeof fetch, state = attempt.state, a: typeof attempt | null = attempt) =>
    finishGoogleSignIn(ctx, settings, { code: "code-1", state, attempt: a }, fetchImpl);

  it("builds a consent URL with PKCE, state, nonce and the PCU domain hint", () => {
    const { url, attempt: started } = startGoogleSignIn(settings);
    const u = new URL(url);
    expect(`${u.origin}${u.pathname}`).toBe(GOOGLE_ENDPOINTS.authorize);
    expect(Object.fromEntries(u.searchParams)).toEqual({
      client_id: settings.clientId,
      redirect_uri: settings.redirectUri,
      response_type: "code",
      scope: "openid email",
      state: started.state,
      nonce: started.nonce,
      code_challenge: createHash("sha256").update(started.verifier).digest("base64url"),
      code_challenge_method: "S256",
      prompt: "select_account",
      hd: "pcu.edu.ph",
    });
    expect(new Set([started.state, started.nonce, started.verifier]).size).toBe(3);
  });

  it("registers a PCU student and starts a session they can use", async () => {
    const google = fakeGoogle(claims);
    const session = await finish(google.fetchImpl);

    expect(session.user.email).toBe("mira.santos@pcu.edu.ph");
    expect(await getSessionUser(ctx, session.sessionToken)).toEqual(session.user);
    expect(session.expiresAt.getTime() - NOW.getTime()).toBe(90 * 24 * 60 * 60 * 1000);
    expect(Object.fromEntries(google.calls[0]!)).toEqual({
      code: "code-1",
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      redirect_uri: settings.redirectUri,
      grant_type: "authorization_code",
      code_verifier: attempt.verifier,
    });
  });

  it("signs an existing student into the same account", async () => {
    const existing = await env.createUser({ email: "mira.santos@pcu.edu.ph" });
    const session = await finish(fakeGoogle(claims).fetchImpl);
    expect(session.user.id).toBe(existing.id);
  });

  it("refuses personal Gmail accounts", async () => {
    const google = fakeGoogle({ ...claims, email: "mira.santos.dev@gmail.com", hd: undefined });
    await expect(finish(google.fetchImpl)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses look-alike domains", async () => {
    const google = fakeGoogle({ ...claims, email: "mira@evilpcu.edu.ph" });
    await expect(finish(google.fetchImpl)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses addresses Google has not verified", async () => {
    const google = fakeGoogle({ ...claims, email_verified: false });
    await expect(finish(google.fetchImpl)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("stops new students while signups are frozen", async () => {
    await writeSignupsFrozen(ctx.db, true);
    await expect(finish(fakeGoogle(claims).fetchImpl)).rejects.toMatchObject({ code: "SIGNUPS_FROZEN" });
  });

  it.each([
    ["the state does not match", { state: "forged" }],
    ["there is no attempt cookie", { attempt: null }],
  ])("rejects the callback when %s, without calling Google", async (_name, override) => {
    const google = fakeGoogle(claims);
    const o = override as { state?: string; attempt?: null };
    await expect(finish(google.fetchImpl, o.state ?? attempt.state, "attempt" in o ? null : attempt)).rejects.toMatchObject({
      code: "VALIDATION",
    });
    expect(google.calls).toHaveLength(0);
  });

  it.each([
    ["a token for another app", { aud: "someone-else" }],
    ["a replayed nonce", { nonce: "old-nonce" }],
    ["an expired token", { exp: NOW.getTime() / 1000 - 1 }],
  ])("rejects %s", async (_name, change) => {
    await expect(finish(fakeGoogle({ ...claims, ...change }).fetchImpl)).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("rejects a token from another issuer", async () => {
    const google = fakeGoogle({ ...claims, iss: "https://evil.example" });
    await expect(finish(google.fetchImpl)).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });

  it("treats a used or expired code as an expired attempt", async () => {
    await expect(finish(fakeGoogle(null, 400).fetchImpl)).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("reports Google being unreachable", async () => {
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    await expect(finish(down)).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
});
