import { beforeEach, describe, expect, it } from "vitest";
import { createCleanupRoute } from "./cleanup-route";
import { loginTokens, sessions } from "./db/schema";
import { createTestContext, type TestEnv } from "./test/helpers";

const SECRET = "cron-secret-0123456789";
const DAY_MS = 24 * 60 * 60 * 1000;

function cron(authorization?: string) {
  return new Request("https://dolphub.tech/api/cron/cleanup", {
    headers: authorization ? { authorization } : {},
  });
}

describe("cleanup route", () => {
  let env: TestEnv;
  let GET: ReturnType<typeof createCleanupRoute>;

  beforeEach(async () => {
    env = await createTestContext();
    GET = createCleanupRoute({ context: async () => env.ctx, secret: SECRET });

    const old = new Date(Date.now() - 3 * DAY_MS);
    const user = await env.createUser();
    await env.db.insert(loginTokens).values([
      { email: "a@pcu.edu.ph", tokenHash: "old", expiresAt: old, createdAt: old },
      { email: "a@pcu.edu.ph", tokenHash: "fresh", expiresAt: new Date(Date.now() + DAY_MS) },
    ]);
    await env.db.insert(sessions).values([
      { userId: user.id, tokenHash: "expired", expiresAt: old },
      { userId: user.id, tokenHash: "live", expiresAt: new Date(Date.now() + DAY_MS) },
    ]);
    await env.storage.put("profiles/x/orphan.webp", new Uint8Array([1]), "image/webp");
    env.storage.objects.get("profiles/x/orphan.webp")!.lastModified = old;
  });

  it("deletes orphaned photos and old sign-in records", async () => {
    const response = await GET(cron(`Bearer ${SECRET}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      images: { deleted: 1, failed: 0 },
      auth: { loginTokens: 1, sessions: 1 },
      analytics: 0,
    });
    expect(env.storage.objects.size).toBe(0);
    expect((await env.db.select().from(loginTokens)).map((t) => t.tokenHash)).toEqual(["fresh"]);
    expect((await env.db.select().from(sessions)).map((s) => s.tokenHash)).toEqual(["live"]);
  });

  it("refuses requests without the secret, and every request when no secret is set", async () => {
    for (const header of [undefined, `Bearer wrong`, SECRET, `Bearer ${SECRET}x`]) {
      expect((await GET(cron(header))).status).toBe(401);
    }
    const unset = createCleanupRoute({ context: async () => env.ctx, secret: undefined });
    expect((await unset(cron("Bearer "))).status).toBe(503);
    expect((await unset(cron(`Bearer ${SECRET}`))).status).toBe(503);
    expect(env.storage.objects.size).toBe(1);
  });

  it("still purges sign-in records when the photo sweep fails", async () => {
    env.storage.list = async () => {
      throw new Error("R2 is down");
    };
    const response = await GET(cron(`Bearer ${SECRET}`));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, images: null, auth: { loginTokens: 1, sessions: 1 }, analytics: 0 });
  });

  it("reports photos it could not delete", async () => {
    env.storage.delete = async () => {
      throw new Error("R2 is down");
    };
    const response = await GET(cron(`Bearer ${SECRET}`));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false, images: { deleted: 0, failed: 1 } });
  });
});
