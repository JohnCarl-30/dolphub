import { expect, test } from "@playwright/test";
import { CRON_SECRET } from "../playwright.config";

test.describe("nightly cleanup", () => {
  test("runs only for Vercel's scheduler", async ({ request }) => {
    expect((await request.get("/api/cron/cleanup")).status()).toBe(401);
    expect(
      (await request.get("/api/cron/cleanup", { headers: { authorization: "Bearer not-the-secret" } })).status(),
    ).toBe(401);

    const run = await request.get("/api/cron/cleanup", { headers: { authorization: `Bearer ${CRON_SECRET}` } });
    expect(run.status()).toBe(200);
    expect(run.headers()["cache-control"]).toBe("no-store");
    // Other tests may run alongside, so check the shape, not the counts.
    expect(await run.json()).toMatchObject({
      ok: true,
      images: { deleted: expect.any(Number), failed: 0 },
      auth: { loginTokens: expect.any(Number), sessions: expect.any(Number), trustedDevices: expect.any(Number) },
    });
  });
});
