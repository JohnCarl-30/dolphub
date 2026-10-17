export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends transactional email. Resend in production. */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
