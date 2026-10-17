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

  it("rejects a partial R2 setup and never prints values", () => {
    expect(() => loadConfig({ ...dev, R2_BUCKET: "only-this" })).toThrow(/R2_ACCOUNT_ID/);
    expect(() => loadConfig({ ...dev, DATABASE_URL: "mysql://secret-value" })).toThrow(
      /^Missing or invalid environment variables: DATABASE_URL$/,
    );
  });
});
