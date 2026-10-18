import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { createGoogleRoutes, googleAttemptCookie } from "./google-routes";
import { getSessionUser } from "./services/auth";
import type { ServiceContext } from "./services/context";
import type { GoogleSettings } from "./services/google";
import { createTestContext, PCU_DOMAINS } from "./test/helpers";

const APP = "https://dolphub.tech";
const settings: GoogleSettings = {
  clientId: "client-123.apps.googleusercontent.com",
  clientSecret: "secret",
  redirectUri: `${APP}/auth/google/callback`,
  allowedDomains: PCU_DOMAINS,
};
const ATTEMPT = googleAttemptCookie(true);

/** Google's token endpoint, answering for whichever address the test picks. */
function fakeGoogle(email: string) {
  return (async (_url: string, init: RequestInit) => {
    const sent = new URLSearchParams(init.body as URLSearchParams);
    const claims = {
      iss: "https://accounts.google.com",
      aud: sent.get("client_id"),
      exp: Date.now() / 1000 + 3600,
      nonce: lastNonce,
      email,
      email_verified: true,
    };
    const part = (v: object) => Buffer.from(JSON.stringify(v)).toString("base64url");
    return Response.json({ id_token: `${part({})}.${part(claims)}.sig` });
  }) as unknown as typeof fetch;
}
let lastNonce = "";

/** The value of a Set-Cookie from a response, or undefined. */
function cookie(response: Response, name: string) {
  const line = response.headers.getSetCookie().find((c) => c.startsWith(`${name}=`));
  return line ? { value: decodeURIComponent(line.slice(name.length + 1).split(";")[0]!), line } : undefined;
}

describe("Google sign-in routes", () => {
  let ctx: ServiceContext;
  let email: string;
  let routes: ReturnType<typeof createGoogleRoutes>;

  beforeEach(async () => {
    ctx = (await createTestContext()).ctx;
    email = "mira.santos@pcu.edu.ph";
    routes = createGoogleRoutes({
      settings: () => settings,
      context: async () => ctx,
      appUrl: APP,
      sessionCookie: "__Host-session",
      secure: true,
      fetch: ((url: string, init: RequestInit) => fakeGoogle(email)(url, init)) as unknown as typeof fetch,
    });
  });

  /** Runs /auth/google, then plays Google sending the student back with a code. */
  async function signIn(tamper: (url: URL) => void = () => {}) {
    const started = await routes.start();
    const google = new URL(started.headers.get("location")!);
    lastNonce = google.searchParams.get("nonce")!;
    const attempt = cookie(started, ATTEMPT)!;

    const back = new URL(google.searchParams.get("redirect_uri")!);
    back.searchParams.set("code", "code-1");
    back.searchParams.set("state", google.searchParams.get("state")!);
    tamper(back);
    const request = new NextRequest(back, { headers: { cookie: `${ATTEMPT}=${attempt.value}` } });
    return { started, attempt, response: await routes.callback(request) };
  }

  it("sends the student to Google with a short-lived, locked-down attempt cookie", async () => {
    const { started, attempt } = await signIn();
    expect(started.status).toBe(303);
    expect(started.headers.get("location")).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
    expect(attempt.line).toMatch(/HttpOnly/i);
    expect(attempt.line).toMatch(/Secure/i);
    expect(attempt.line).toMatch(/SameSite=lax/i);
    expect(attempt.line).toMatch(/Path=\//);
    expect(attempt.line).toMatch(/Max-Age=600/);
  });

  it("comes back with a session cookie that signs the student in", async () => {
    const { response } = await signIn();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${APP}/dashboard`);

    const session = cookie(response, "__Host-session")!;
    expect(session.line).toMatch(/HttpOnly/i);
    expect(session.line).toMatch(/Secure/i);
    expect(await getSessionUser(ctx, session.value)).toMatchObject({ email });
    expect(cookie(response, ATTEMPT)!.line).toMatch(/Max-Age=0/);
  });

  it.each([
    ["a Gmail account", () => (email = "mira.santos.dev@gmail.com"), () => {}, "not-pcu"],
    ["a forged state", () => {}, (u: URL) => u.searchParams.set("state", "forged"), "expired"],
    ["Cancel on Google's screen", () => {}, (u: URL) => u.searchParams.set("error", "access_denied"), "cancelled"],
  ])("returns to the dashboard with a reason after %s", async (_name, setup, tamper, reason) => {
    setup();
    const { response } = await signIn(tamper);
    expect(response.headers.get("location")).toBe(`${APP}/dashboard?signin=${reason}`);
    expect(cookie(response, "__Host-session")).toBeUndefined();
    expect(cookie(response, ATTEMPT)!.line).toMatch(/Max-Age=0.*Secure|Secure.*Max-Age=0/i);
  });

  it("rejects a callback that arrives without the attempt cookie", async () => {
    const response = await routes.callback(new NextRequest(`${APP}/auth/google/callback?code=c&state=s`));
    expect(response.headers.get("location")).toBe(`${APP}/dashboard?signin=expired`);
  });

  it("says Google sign-in is unavailable when no OAuth client is configured", async () => {
    const off = createGoogleRoutes({
      settings: () => null,
      context: async () => ctx,
      appUrl: APP,
      sessionCookie: "session",
      secure: false,
    });
    expect((await off.start()).headers.get("location")).toBe(`${APP}/dashboard?signin=unavailable`);
  });
});
