import type { Metadata } from "next";
import Link from "next/link";
import { InfoList, InfoPage, InfoSection } from "@/components/info-page";
import { SupportContacts } from "@/components/support-contacts";
import { OG_DEFAULTS } from "@/lib/seo";

const title = "Privacy & Security";
const description =
  "How Dolphub collects, uses, shares, protects, and deletes personal information.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacy" },
  openGraph: { ...OG_DEFAULTS, title, description, url: "/privacy" },
  twitter: { card: "summary_large_image", title, description },
};

const inlineLink =
  "font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink focus-visible:ring-2 focus-visible:ring-ink";

export default function PrivacyPage() {
  return (
    <InfoPage
      path="/privacy"
      title="Privacy & Security"
      intro="This notice explains what personal information Dolphub handles, why it is needed, who helps process it, and the choices available to you."
    >
      <InfoSection id="responsibility" title="Who is responsible">
        <p>
          Dolphub operates this portfolio service for PCU tech students. Questions, privacy requests,
          and objections can be sent to <SupportContacts subject="Dolphub privacy request" />
          .
        </p>
      </InfoSection>

      <InfoSection id="information" title="Information we handle">
        <InfoList>
          <li>Your PCU email address, account timestamps, and administrative account status.</li>
          <li>
            Your handle, display name, course, tagline, projects, project links, and uploaded images.
          </li>
          <li>
            Optional public contact details you choose to add, such as Messenger, GitHub, or a contact
            email address.
          </li>
          <li>Project stars you add or remove while signed in. Dolphub shows project totals publicly, not who starred them.</li>
          <li>Anonymous, aggregated profile views, estimated unique visitors, referral categories, and project or contact-link clicks. A short-lived keyed hash supports daily deduplication and is removed by nightly cleanup; raw network addresses and browser user agents are not stored by Dolphub.</li>
          <li>If you sign up for the opportunities email, the address and topics you choose. Unsubscribing or deleting your account removes them.</li>
          <li>
            Security records such as hashed sign-in and session tokens, a keyed hash of the requesting
            network, and standard request information processed by the hosting platform.
          </li>
          <li>Messages and details you send when asking for support or reporting a problem.</li>
        </InfoList>
      </InfoSection>

      <InfoSection id="purposes" title="Why we use it">
        <InfoList>
          <li>Verify eligibility, send sign-in links, and keep you signed in.</li>
          <li>Create, display, update, cache, and share the portfolio page you ask Dolphub to host.</li>
          <li>Show profile owners aggregate traffic and link-click counts for their own pages.</li>
          <li>Protect the service, enforce limits, investigate abuse, and moderate public content.</li>
          <li>Answer support, privacy, deletion, and security requests.</li>
          <li>Meet legal obligations and establish or defend legal claims when necessary.</li>
        </InfoList>
        <p>
          Processing is based on providing the service you request, your choices for optional public
          information, Dolphub&apos;s legitimate interest in operating a secure service, and legal duties
          where they apply.
        </p>
      </InfoSection>

      <InfoSection id="public" title="What becomes public">
        <p>
          A published profile can be visited by anyone with its URL. It may show your display name,
          handle, course, tagline, project text, project links, images, and any optional contact details
          you add. Turning off search-engine visibility asks search engines not to index the page; it
          does not make the direct URL private.
        </p>
        <p>
          Your sign-in email is not copied to your public page. Dolphub does not sell personal
          information or run advertising profiles. A small first-party beacon records anonymous aggregate portfolio activity.
        </p>
      </InfoSection>

      <InfoSection id="storage" title="Cookies and browser storage">
        <p>
          Signed-in accounts use one essential, HTTP-only session cookie. A session can last up to 30
          days unless you sign out or it is revoked. The home showcase also uses browser session
          storage to remember whether you chose the list or scroll view; that storage is limited to
          the browser tab&apos;s session.
        </p>
      </InfoSection>

      <InfoSection id="providers" title="Service providers">
        <p>Dolphub relies on providers that process information only to operate the service:</p>
        <InfoList>
          <li>Vercel hosts and delivers the application.</li>
          <li>Neon stores account, profile, project, authentication, and moderation records.</li>
          <li>Cloudflare R2 stores uploaded project images.</li>
          <li>Resend delivers one-time sign-in emails.</li>
          <li>Email and GitHub process information if you contact support or file a security report.</li>
        </InfoList>
        <p>
          These providers may process information in countries outside the Philippines under their
          service terms and security commitments.
        </p>
      </InfoSection>

      <InfoSection id="retention" title="How long we keep it">
        <InfoList>
          <li>
            One-time sign-in links expire after 15 minutes. Authentication cleanup removes their records
            after two days.
          </li>
          <li>
            Sessions become unusable after 30 days. Authentication cleanup removes expired session
            records.
          </li>
          <li>Account and portfolio content remains while the account is active or until it is deleted.</li>
          <li>
            Limited audit records may remain as long as needed for security and accountability, without
            retaining the deleted public profile.
          </li>
          <li>Support messages remain only as long as needed to resolve and document the request.</li>
        </InfoList>
      </InfoSection>

      <InfoSection id="security" title="How we protect information">
        <p>
          Dolphub stores hashes instead of raw sign-in and session tokens, uses secure HTTP-only
          cookies in production, hashes network identifiers used for rate limits, validates uploads,
          restricts administrative actions, and applies browser security headers. No online system can
          promise perfect security.
        </p>
        <p>
          If you believe you found a vulnerability, do not post it publicly. Use the{" "}
          <a
            className={inlineLink}
            href="https://github.com/JohnCarl-30/dolphub/security/advisories/new"
          >
            private vulnerability report
          </a>{" "}
          or read the <Link className={inlineLink} href="/support">support guidance</Link>.
        </p>
      </InfoSection>

      <InfoSection id="rights" title="Your privacy rights">
        <p>
          Subject to applicable law, you may ask to be informed, access or correct your information,
          object to processing, withdraw consent where consent is used, request erasure or blocking,
          receive portable data where applicable, or raise a complaint with the Philippine National
          Privacy Commission.
        </p>
        <p>
          Email <SupportContacts subject="Dolphub privacy request" />{" "}
          from your account address when possible. Dolphub may need to verify your identity before
          acting on a request.
        </p>
      </InfoSection>

      <InfoSection id="changes" title="Changes to this notice">
        <p>
          This page will be updated when Dolphub&apos;s handling of personal information changes. A material
          change will receive a new date and an appropriate notice before it takes effect.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
