import type { EmailMessage, EmailSender } from "./types";

/** Local development without Resend: prints the email to the server log. */
export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
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
