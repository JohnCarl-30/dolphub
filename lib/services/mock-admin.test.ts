import { describe, expect, it } from "vitest";
import { createTestContext } from "../test/helpers";
import { getSessionUser } from "./auth";
import { MOCK_ADMIN, mockAdminEnabled, signInMockAdmin } from "./mock-admin";

describe("mockAdminEnabled", () => {
  it("is on only for local development against pglite", () => {
    expect(mockAdminEnabled({ NODE_ENV: "development", DATABASE_URL: "pglite:./.data/pglite" })).toBe(true);
    expect(mockAdminEnabled({ NODE_ENV: "production", DATABASE_URL: "pglite:./.data/e2e-pglite" })).toBe(false);
    expect(mockAdminEnabled({ NODE_ENV: "development", DATABASE_URL: "postgres://user@neon.tech/db" })).toBe(false);
    expect(mockAdminEnabled({ NODE_ENV: "production", DATABASE_URL: "postgres://user@neon.tech/db" })).toBe(false);
    expect(mockAdminEnabled({})).toBe(false);
  });
});

describe("signInMockAdmin", () => {
  it("creates the admin account the first time and signs in as an admin", async () => {
    const { ctx } = await createTestContext();
    const session = await signInMockAdmin(ctx, { email: " Admin@PCU.edu.ph ", password: MOCK_ADMIN.password });
    expect(session.user).toMatchObject({ email: MOCK_ADMIN.email, isAdmin: true });
    expect(await getSessionUser(ctx, session.sessionToken)).toMatchObject({ isAdmin: true });

    // Signing in again reuses the same account.
    const again = await signInMockAdmin(ctx, MOCK_ADMIN);
    expect(again.user.id).toBe(session.user.id);
  });

  it("refuses the wrong email or password", async () => {
    const { ctx } = await createTestContext();
    await expect(signInMockAdmin(ctx, { email: MOCK_ADMIN.email, password: "Password" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(signInMockAdmin(ctx, { email: "someone@pcu.edu.ph", password: MOCK_ADMIN.password })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });
});
