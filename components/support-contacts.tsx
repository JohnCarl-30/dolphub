const CONTACTS = [
  { name: "Evert Matthew Matias", email: "fnzh.4u@gmail.com" },
  { name: "John Carl", email: "johncarlsantos30@gmail.com" },
] as const;

/** Where "Report a problem" links on public pages go: the maintainer who runs the admin page. */
export const REPORT_EMAIL = "johncarlsantos30@gmail.com";

const inlineLink =
  "font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink focus-visible:ring-2 focus-visible:ring-ink";

const buttonLink =
  "press inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink";

export function SupportContacts({
  subject,
  variant = "inline",
}: {
  subject: string;
  variant?: "inline" | "buttons";
}) {
  if (variant === "buttons") {
    return (
      <div className="mt-5 flex flex-wrap gap-3">
        {CONTACTS.map((contact) => (
          <a
            key={contact.email}
            href={`mailto:${contact.email}?subject=${encodeURIComponent(subject)}`}
            className={buttonLink}
          >
            Email {contact.name} · {contact.email}
          </a>
        ))}
      </div>
    );
  }

  return (
    <>
      {CONTACTS.map((contact, index) => (
        <span key={contact.email}>
          {index > 0 ? " or " : null}
          <a
            className={inlineLink}
            href={`mailto:${contact.email}?subject=${encodeURIComponent(subject)}`}
          >
            {contact.name} ({contact.email})
          </a>
        </span>
      ))}
    </>
  );
}
