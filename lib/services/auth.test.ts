import { beforeEach, describe, expect, it } from "vitest";
import { loginTokens, sessions } from "../db/schema";
import { MemoryEmailSender } from "../email/dev";
import { createTestContext, PCU_DOMAINS, type TestEnv } from "../test/helpers";
import { deleteAccount } from "./admin";
import {
  AUTH_LIMITS,
  consumeSignInLink,
  getSessionUser,
  hashToken,
  purgeExpiredAuthRecords,
  requestSignInLink,
  signOut,
} from "./auth";
import type { ServiceContext } from "./context";
import { writeSignupsFrozen } from "./settings";

const settings = { allowedDomains: PCU_DOMAINS, appUrl: "https://dolphub.tech/" };

/** The token from the most recent email's link. */
function tokenFrom(sender: MemoryEmailSender): string {
  const text = sender.sent.at(-1)!.text;
  const match = text.match(/https:\/\/dolphub\.tech\/auth\/verify\?token=([A-Za-z0-9_-]+)/);
  expect(match).not.toBeNull();
  return match![1]!;
}

describe("sign-in links", () => {
  let env: TestEnv;
  let sender: MemoryEmailSender;
  let clock: Date;
  let ctx: ServiceContext;

  beforeEach(async () => {
    env = await createTestContext();
    sender = new MemoryEmailSender();
    clock = new Date("2026-10-20T08:00:00Z");
    ctx = { ...env.ctx, now: () => clock };
  });

  const advance = (ms: number) => {
    clock = new Date(clock.getTime() + ms);
  };

  it("emails a link to dolphub.tech and stores only a hash of its token", async () => {
    await requestSignInLink(ctx, sender, settings, " Juan@PCU.edu.ph ");
    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0]!.to).toBe("juan@pcu.edu.ph");
    const token = tokenFrom(sender);
    const [row] = await env.db.select().from(loginTokens);
    expect(row!.tokenHash).toBe(hashToken(token));
    expect(row!.tokenHash).not.toContain(token);
  });

  it("signs in a new student, creating the account, and the session works", async () => {
    await requestSignInLink(ctx, sender, settings, "maria@pcu.edu.ph");
    const { sessionToken, user } = await consumeSignInLink(ctx, settings, tokenFrom(sender));
    expect(user.email).toBe("maria@pcu.edu.ph");
    expect(await getSessionUser(ctx, sessionToken)).toMatchObject({ id: user.id, isAdmin: false });
    expect(await getSessionUser(ctx, "wrong-token")).toBeNull();
    expect(await getSessionUser(ctx, undefined)).toBeNull();
  });

  it("works only once", async () => {
    await requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph");
    const token = tokenFrom(sender);
    await consumeSignInLink(ctx, settings, token);
    await expect(consumeSignInLink(ctx, settings, token)).rejects.toMatchObject({ field: "token" });
  });

  it("expires after 15 minutes", async () => {
    await requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph");
    advance(AUTH_LIMITS.linkTtlMs + 1);
    await expect(consumeSignInLink(ctx, settings, tokenFrom(sender))).rejects.toMatchObject({ field: "token" });
  });

  it("rejects empty and unknown tokens", async () => {
    await expect(consumeSignInLink(ctx, settings, "")).rejects.toMatchObject({ field: "token" });
    await expect(consumeSignInLink(ctx, settings, "nope")).rejects.toMatchObject({ field: "token" });
  });

  it("refuses non-PCU addresses and sends nothing", async () => {
    await expect(requestSignInLink(ctx, sender, settings, "x@gmail.com")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(requestSignInLink(ctx, sender, settings, "not an email")).rejects.toMatchObject({
      code: "VALIDATION",
    });
    expect(sender.sent).toHaveLength(0);
  });

  it("still emails existing users while signups are frozen, but not new ones", async () => {
    await env.createUser({ email: "old@pcu.edu.ph" });
    await writeSignupsFrozen(env.db, true);
    await requestSignInLink(ctx, sender, settings, "old@pcu.edu.ph");
    await expect(requestSignInLink(ctx, sender, settings, "new@pcu.edu.ph")).rejects.toMatchObject({
      code: "SIGNUPS_FROZEN",
    });
    expect(sender.sent.map((m) => m.to)).toEqual(["old@pcu.edu.ph"]);
  });

  it("limits links per address, then allows more after 15 minutes", async () => {
    for (let i = 0; i < AUTH_LIMITS.linksPerEmail; i++) {
      await requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph");
    }
    await expect(requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph")).rejects.toMatchObject({
      code: "LIMIT_REACHED",
    });
    advance(AUTH_LIMITS.linkWindowMs + 1);
    await requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph");
  });

  it("stops at the daily email cap", async () => {
    const capped = { ...settings, dailyEmailCap: 2 };
    await requestSignInLink(ctx, sender, capped, "a@pcu.edu.ph");
    await requestSignInLink(ctx, sender, capped, "b@pcu.edu.ph");
    await expect(requestSignInLink(ctx, sender, capped, "c@pcu.edu.ph")).rejects.toThrow(/busy today/);
  });

  it("removes the link when the email fails to send", async () => {
    const failing = { send: async () => Promise.reject(new Error("Resend down")) };
    await expect(requestSignInLink(ctx, failing, settings, "a@pcu.edu.ph")).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    expect(await env.db.select().from(loginTokens)).toHaveLength(0);
  });

  it("ends the session on sign-out, on expiry, and on account deletion", async () => {
    await requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph");
    const first = await consumeSignInLink(ctx, settings, tokenFrom(sender));
    await signOut(ctx, first.sessionToken);
    expect(await getSessionUser(ctx, first.sessionToken)).toBeNull();

    await requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph");
    const second = await consumeSignInLink(ctx, settings, tokenFrom(sender));
    advance(AUTH_LIMITS.sessionTtlMs + 1);
    expect(await getSessionUser(ctx, second.sessionToken)).toBeNull();

    clock = new Date("2026-12-01T00:00:00Z");
    await requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph");
    const third = await consumeSignInLink(ctx, settings, tokenFrom(sender));
    await deleteAccount(ctx, { actorUserId: third.user.id, targetUserId: third.user.id, confirm: true });
    expect(await getSessionUser(ctx, third.sessionToken)).toBeNull();
    expect(await env.db.select().from(sessions)).toHaveLength(0);
  });

  it("purges old links and expired sessions", async () => {
    await requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph");
    await consumeSignInLink(ctx, settings, tokenFrom(sender));
    advance(AUTH_LIMITS.sessionTtlMs + 1);
    expect(await purgeExpiredAuthRecords(ctx)).toEqual({ loginTokens: 1, sessions: 1 });
  });
});
