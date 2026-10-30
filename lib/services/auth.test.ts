import { beforeEach, describe, expect, it } from "vitest";
import { loginTokens, sessions, trustedDevices } from "../db/schema";
import { MemoryEmailSender } from "../email/dev";
import { createTestContext, PCU_DOMAINS, type TestEnv } from "../test/helpers";
import { deleteAccount } from "./admin";
import {
  AUTH_LIMITS,
  consumeSignInLink,
  getSessionUser,
  hashNetwork,
  hashToken,
  networkOf,
  purgeExpiredAuthRecords,
  signInTrustedDevice,
  trustDevice,
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

  it("carries a safe return path in the emailed link, and drops an unsafe one", async () => {
    await requestSignInLink(ctx, sender, settings, "juan@pcu.edu.ph", null, "/opportunities/acme-intern-a1b2");
    expect(sender.sent.at(-1)!.text).toMatch(/\/auth\/verify\?token=[A-Za-z0-9_-]+&next=%2Fopportunities%2Facme-intern-a1b2/);
    await requestSignInLink(ctx, sender, settings, "juan@pcu.edu.ph", null, "https://evil.example");
    expect(sender.sent.at(-1)!.text).not.toContain("next=");
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
    expect(await purgeExpiredAuthRecords(ctx)).toEqual({ loginTokens: 1, sessions: 1, trustedDevices: 0 });
  });

  it("signs a remembered browser back in without an email, only for its own address", async () => {
    await requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph");
    const first = await consumeSignInLink(ctx, settings, tokenFrom(sender));
    const { deviceToken } = await trustDevice(ctx, first.user.id);
    await signOut(ctx, first.sessionToken);

    const again = await signInTrustedDevice(ctx, deviceToken, " A@pcu.edu.ph ");
    expect(again?.user.id).toBe(first.user.id);
    expect(await getSessionUser(ctx, again!.sessionToken)).toMatchObject({ email: "a@pcu.edu.ph" });
    expect(await signInTrustedDevice(ctx, deviceToken, "b@pcu.edu.ph")).toBeNull();
    expect(await signInTrustedDevice(ctx, "made-up", "a@pcu.edu.ph")).toBeNull();
    expect(await signInTrustedDevice(ctx, undefined, "a@pcu.edu.ph")).toBeNull();

    advance(AUTH_LIMITS.deviceTtlMs + 1);
    expect(await signInTrustedDevice(ctx, deviceToken, "a@pcu.edu.ph")).toBeNull();
    expect((await purgeExpiredAuthRecords(ctx)).trustedDevices).toBe(1);
  });

  it("forgets remembered browsers when the account is deleted", async () => {
    await requestSignInLink(ctx, sender, settings, "a@pcu.edu.ph");
    const session = await consumeSignInLink(ctx, settings, tokenFrom(sender));
    const { deviceToken } = await trustDevice(ctx, session.user.id);
    await deleteAccount(ctx, { actorUserId: session.user.id, targetUserId: session.user.id, confirm: true });
    expect(await signInTrustedDevice(ctx, deviceToken, "a@pcu.edu.ph")).toBeNull();
    expect(await env.db.select().from(trustedDevices)).toHaveLength(0);
  });
});

describe("networkOf", () => {
  it("keeps IPv4 whole and groups IPv6 by its /64 prefix", () => {
    expect(networkOf("203.0.113.7")).toBe("203.0.113.7");
    expect(networkOf(" ::ffff:203.0.113.7 ")).toBe("203.0.113.7");
    expect(networkOf("2001:db8:aa:1::5")).toBe("2001:db8:aa:1::/64");
    expect(networkOf("2001:0db8:00aa:0001:9:9:9:9")).toBe("2001:db8:aa:1::/64");
    expect(networkOf("2001:db8::1")).toBe("2001:db8:0:0::/64");
  });

  it("ignores values that are not IP addresses", () => {
    expect(networkOf(undefined)).toBeNull();
    expect(networkOf("")).toBeNull();
    expect(networkOf("unknown")).toBeNull();
    expect(networkOf("1.2.3.4; drop table")).toBeNull();
  });
});

describe("per-network sign-in limit", () => {
  let env: TestEnv;
  let sender: MemoryEmailSender;
  const limited = { ...settings, linksPerNetworkPerHour: 3, rateLimitKey: "test-secret-key-123" };

  beforeEach(async () => {
    env = await createTestContext();
    sender = new MemoryEmailSender();
  });

  it("stops one network after the limit, across different addresses", async () => {
    for (const name of ["a", "b", "c"]) {
      await requestSignInLink(env.ctx, sender, limited, `${name}@pcu.edu.ph`, "203.0.113.7");
    }
    await expect(
      requestSignInLink(env.ctx, sender, limited, "d@pcu.edu.ph", "203.0.113.7"),
    ).rejects.toThrow(/from this network/);
    // Another device on the same IPv6 /64 counts as the same network.
    for (const n of [1, 2, 3]) {
      await requestSignInLink(env.ctx, sender, limited, `v6${n}@pcu.edu.ph`, `2001:db8:aa:1::${n}`);
    }
    await expect(
      requestSignInLink(env.ctx, sender, limited, "v64@pcu.edu.ph", "2001:db8:aa:1:ffff::9"),
    ).rejects.toThrow(/from this network/);
    // A different network is unaffected.
    await requestSignInLink(env.ctx, sender, limited, "e@pcu.edu.ph", "198.51.100.2");
    expect(sender.sent).toHaveLength(7);
  });

  it("allows the network again after an hour", async () => {
    let clock = new Date("2026-10-20T08:00:00Z");
    const ctx = { ...env.ctx, now: () => clock };
    for (const name of ["a", "b", "c"]) {
      await requestSignInLink(ctx, sender, limited, `${name}@pcu.edu.ph`, "203.0.113.7");
    }
    clock = new Date(clock.getTime() + 60 * 60 * 1000 + 1);
    await requestSignInLink(ctx, sender, limited, "d@pcu.edu.ph", "203.0.113.7");
  });

  it("stores only a keyed hash, never the address", async () => {
    await requestSignInLink(env.ctx, sender, limited, "a@pcu.edu.ph", "203.0.113.7");
    const [row] = await env.db.select().from(loginTokens);
    expect(row!.requesterHash).toBe(hashNetwork("203.0.113.7", "test-secret-key-123"));
    expect(row!.requesterHash).not.toContain("203.0.113");
    expect(hashNetwork("203.0.113.7", "other-key-123456")).not.toBe(row!.requesterHash);
  });

  it("is off without a key or an address", async () => {
    for (const name of ["a", "b", "c", "d"]) {
      await requestSignInLink(env.ctx, sender, { ...limited, rateLimitKey: undefined }, `${name}@pcu.edu.ph`, "203.0.113.7");
    }
    for (const name of ["e", "f", "g", "h"]) {
      await requestSignInLink(env.ctx, sender, limited, `${name}@pcu.edu.ph`, null);
    }
    expect(sender.sent).toHaveLength(8);
  });
});
