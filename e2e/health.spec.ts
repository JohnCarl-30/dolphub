import { expect, test } from "@playwright/test";

test("health check reports the database is reachable", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(res.headers()["cache-control"]).toBe("no-store");
  expect(await res.json()).toEqual({ ok: true });
});
