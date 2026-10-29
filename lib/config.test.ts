import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";

const dev = { DATABASE_URL: "pglite:./.data/pglite", PCU_EMAIL_DOMAINS: "pcu.edu.ph, Students.PCU.edu.ph" };
const r2 = {
  R2_ACCOUNT_ID: "a",
  R2_ACCESS_KEY_ID: "b",
  R2_SECRET_ACCESS_KEY: "c",
  R2_BUCKET: "d",
  R2_PUBLIC_BASE_URL: "https://images.dolphub.tech/",
};

describe("loadConfig", () => {
  it("runs locally with only a database and domains", () => {
    const c = loadConfig(dev);
    expect(c.PCU_EMAIL_DOMAINS).toEqual(["pcu.edu.ph", "students.pcu.edu.ph"]);
    expect(c.APP_URL).toBe("http://localhost:3000");
    expect(c.EMAIL_FROM).toBe("PCU Community <login@dolphub.tech>");
    expect(c.RESEND_API_KEY).toBeUndefined();
    expect(c.SIGNIN_LINKS_PER_NETWORK_PER_HOUR).toBe(30);
    expect(c.RATE_LIMIT_SECRET).toBeUndefined();
    expect(() => loadConfig({ ...dev, RATE_LIMIT_SECRET: "short" })).toThrow(/RATE_LIMIT_SECRET/);
    expect(c.CRON_SECRET).toBeUndefined();
    expect(() => loadConfig({ ...dev, CRON_SECRET: "short" })).toThrow(/CRON_SECRET/);
    expect(c.ADMIN_MCP_TOKEN).toBeUndefined();
    expect(() => loadConfig({ ...dev, ADMIN_MCP_TOKEN: "x".repeat(32) })).toThrow(/ADMIN_MCP_EMAIL/);
    expect(() => loadConfig({ ...dev, ADMIN_MCP_TOKEN: "short", ADMIN_MCP_EMAIL: "a@pcu.edu.ph" })).toThrow(/ADMIN_MCP_TOKEN/);
  });

  it("requires Resend, R2, https and a real database in production", () => {
    expect(() => loadConfig({ ...dev, NODE_ENV: "production" })).toThrow(
      /RESEND_API_KEY.*R2_ACCOUNT_ID.*DATABASE_URL.*APP_URL/,
    );
    const ok = loadConfig({
      ...r2,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://u:p@host/db",
      PCU_EMAIL_DOMAINS: "pcu.edu.ph",
      RESEND_API_KEY: "re_123",
      APP_URL: "https://dolphub.tech/",
    });
    expect(ok.APP_URL).toBe("https://dolphub.tech");
    expect(ok.R2_PUBLIC_BASE_URL).toBe("https://images.dolphub.tech");
  });

  it("allows the explicit browser-test environment to use local services", () => {
    const testConfig = loadConfig({
      ...dev,
      NODE_ENV: "production",
      E2E_TEST: "1",
      APP_URL: "http://127.0.0.1:3100",
    });
    expect(testConfig.E2E_TEST).toBe("1");
    expect(testConfig.DATABASE_URL).toBe("pglite:./.data/pglite");
  });

  it("rejects a partial R2 setup and never prints values", () => {
    expect(() => loadConfig({ ...dev, R2_BUCKET: "only-this" })).toThrow(/R2_ACCOUNT_ID/);
    expect(() => loadConfig({ ...dev, DATABASE_URL: "mysql://secret-value" })).toThrow(
      /^Missing or invalid environment variables: DATABASE_URL$/,
    );
  });
});
