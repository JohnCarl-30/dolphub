import type { Metadata } from "next";
import Link from "next/link";
import { InfoList, InfoPage, InfoSection } from "@/components/info-page";
import { SupportContacts } from "@/components/support-contacts";
import { OG_DEFAULTS } from "@/lib/seo";

const title = "Support";
const description = "Get help with signing in, managing a Dolphub profile, privacy, or security.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/support" },
  openGraph: { ...OG_DEFAULTS, title, description, url: "/support" },
  twitter: { card: "summary_large_image", title, description },
};

const inlineLink =
  "font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink focus-visible:ring-2 focus-visible:ring-ink";

export default function SupportPage() {
  return (
    <InfoPage
      path="/support"
      title="Support"
      intro="Start with the quick checks below. If the problem continues, email support with enough detail to reproduce it—without sending a sign-in link or other secret."
    >
      <section aria-labelledby="contact" className="border border-ink/10 bg-paper p-5 sm:p-6">
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Contact</p>
        <h2 id="contact" className="mt-3 text-2xl font-medium tracking-tight">
          Email the Dolphub maintainers
        </h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-muted">
          Include your handle if relevant, what you expected, what happened, and the browser or device
          you were using. Never include a sign-in link or session cookie.
        </p>
        <SupportContacts subject="Dolphub support" variant="buttons" />
      </section>

      <InfoSection id="sign-in" title="Sign-in help">
        <InfoList>
          <li>Use your own eligible PCU email address and check the spelling before submitting.</li>
          <li>Check spam or junk folders. A sign-in link works once and expires after 15 minutes.</li>
          <li>If you requested several links, open only the newest message.</li>
          <li>After repeated requests, wait 15 minutes before trying again.</li>
        </InfoList>
      </InfoSection>

      <InfoSection id="profile" title="Profile and project help">
        <InfoList>
          <li>A portfolio enters the showcase after it has at least one project with a title.</li>
          <li>Project demo and source links must use valid HTTPS addresses.</li>
          <li>Optional contact information becomes public as soon as it appears on your page.</li>
          <li>Send support your handle and clear steps if a saved change does not appear.</li>
        </InfoList>
      </InfoSection>

      <InfoSection id="account" title="Privacy, corrections, and deletion">
        <p>
          Email support from your account address when possible to request a correction, a copy of your
          information, a privacy review, or account deletion. Dolphub may ask for additional verification
          before changing or deleting account data.
        </p>
        <p>
          Read <Link className={inlineLink} href="/privacy">Privacy &amp; Security</Link> for the full
          notice and available privacy rights.
        </p>
      </InfoSection>

      <InfoSection id="report-content" title="Report a public page">
        <p>
          Email support with the page URL, the specific content at issue, and why it should be reviewed.
          Do not send unnecessary personal information. Dolphub may temporarily hide content while a
          report is assessed.
        </p>
      </InfoSection>

      <InfoSection id="security-report" title="Report a security vulnerability">
        <p>
          Do not open a public issue or test against another student&apos;s data. Submit a{" "}
          <a
            className={inlineLink}
            href="https://github.com/JohnCarl-30/dolphub/security/advisories/new"
          >
            private GitHub vulnerability report
          </a>{" "}
          with reproduction steps and the possible impact. Stop testing if you encounter information
          that is not yours.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
