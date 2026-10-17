import { describe, expect, it } from "vitest";
import { ResendEmailSender } from "./resend";

const message = { to: "juan@pcu.edu.ph", subject: "Hi", text: "plain", html: "<p>html</p>" };

describe("ResendEmailSender", () => {
  it("posts the email to Resend's API with the key and sender", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fakeFetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: "email_1" }), { status: 200 });
    }) as typeof fetch;

    await new ResendEmailSender("re_test", "PCU Community <login@dolphub.tech>", fakeFetch).send(message);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.resend.com/emails");
    expect(calls[0]!.init.method).toBe("POST");
    expect((calls[0]!.init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
      from: "PCU Community <login@dolphub.tech>",
      to: ["juan@pcu.edu.ph"],
      subject: "Hi",
      text: "plain",
      html: "<p>html</p>",
    });
  });

  it("throws with Resend's reason when the email is rejected", async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ message: "The dolphub.tech domain is not verified" }), {
        status: 403,
      })) as unknown as typeof fetch;
    await expect(new ResendEmailSender("re_test", "x <a@dolphub.tech>", fakeFetch).send(message)).rejects.toThrow(
      /403.*not verified/,
    );
  });
});
