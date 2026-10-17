import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsoleEmailSender, MemoryEmailSender } from "./email/dev";
import { describeError, logError, redact } from "./log";
import { requestSignInLink } from "./services/auth";
import { createTestContext, PCU_DOMAINS } from "./test/helpers";

const EMAIL = "juan.dela.cruz@pcu.edu.ph";
const settings = { allowedDomains: PCU_DOMAINS, appUrl: "https://dolphub.tech" };

/** Everything a logError call wrote, as one string. */
function captureLogs() {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  return { spy, text: () => JSON.stringify(spy.mock.calls) };
}

afterEach(() => vi.restoreAllMocks());

describe("redact", () => {
  it("masks email addresses and Drizzle's query values", () => {
    expect(redact(`Failed query: select * from users where email = $1\nparams: ${EMAIL},x`)).toBe(
      "Failed query: select * from users where email = $1\nparams: [redacted]",
    );
    expect(redact(`Resend rejected the email (422): invalid to address ${EMAIL}`)).toBe(
      "Resend rejected the email (422): invalid to address [email]",
    );
  });
});

describe("logging a real database failure during sign-in", () => {
  it("keeps the query and Postgres code but never the student's email", async () => {
    const env = await createTestContext();
    // Break the table the sign-in request reads, so Drizzle throws with the email as a query value.
    await env.db.execute(sql`drop table login_tokens`);

    let thrown: unknown;
    try {
      await requestSignInLink(env.ctx, new MemoryEmailSender(), settings, EMAIL);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(Error);
    // Prove the raw error really does carry the email, so the test means something.
    expect(`${(thrown as Error).message}${(thrown as Error).stack}`).toContain(EMAIL);

    const safe = describeError(thrown);
    expect(JSON.stringify(safe)).not.toContain(EMAIL);
    expect(JSON.stringify(safe)).not.toMatch(/@pcu\.edu\.ph/);
    expect(safe.message).toContain("Failed query");
    expect(safe.message).toContain("params: [redacted]");
    expect(safe.cause?.code).toBe("42P01");

    const logs = captureLogs();
    logError("Sign-in link request", thrown);
    expect(logs.spy).toHaveBeenCalledTimes(1);
    expect(logs.text()).not.toContain(EMAIL);
  });
});

describe("logging a failed email send", () => {
  it("does not log the recipient echoed back by the email service", async () => {
    const env = await createTestContext();
    const failing = {
      send: async () => {
        throw new Error(`Resend rejected the email (422): ${EMAIL} is not a valid recipient`);
      },
    };
    const logs = captureLogs();
    await expect(requestSignInLink(env.ctx, failing, settings, EMAIL)).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    expect(logs.spy).toHaveBeenCalledWith("Sign-in email failed", expect.anything());
    expect(logs.text()).not.toContain(EMAIL);
  });
});

describe("describeError", () => {
  it("handles values that are not errors", () => {
    expect(describeError(`oops ${EMAIL}`)).toEqual({ name: "string", message: "oops [email]" });
  });
});

describe("ConsoleEmailSender", () => {
  it("refuses to print emails in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(
      new ConsoleEmailSender().send({ to: EMAIL, subject: "s", text: "t", html: "h" }),
    ).rejects.toThrow(/local development only/);
    expect(log).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
