import type { EmailMessage, EmailSender } from "./types";

/** Resend's HTTP API. The `from` domain must be verified in the Resend dashboard. */
export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    const response = await this.fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });
    if (!response.ok) {
      // Resend's error body names the problem, such as an unverified domain. It holds no secrets.
      const detail = await response.text().catch(() => "");
      throw new Error(`Resend rejected the email (${response.status}): ${detail.slice(0, 300)}`);
    }
  }
}
