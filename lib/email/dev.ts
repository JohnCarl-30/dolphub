import type { EmailMessage, EmailSender } from "./types";

/**
 * Local development without Resend: prints the email to the terminal.
 * Refuses to run in production, where it would write an address and a live
 * sign-in link into the server logs.
 */
export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ConsoleEmailSender is for local development only. Set RESEND_API_KEY.");
    }
    console.log(`\n[email] to ${message.to}: ${message.subject}\n${message.text}\n`);
  }
}

/** Tests: keeps every message so assertions can read it. */
export class MemoryEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];
  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
  }
}
