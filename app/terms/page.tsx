import type { Metadata } from "next";
import { InfoList, InfoPage, InfoSection } from "@/components/info-page";
import { SupportContacts } from "@/components/support-contacts";
import { OG_DEFAULTS } from "@/lib/seo";

const title = "Terms & Conditions";
const description = "The rules for creating, publishing, and using a portfolio on Dolphub.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/terms" },
  openGraph: { ...OG_DEFAULTS, title, description, url: "/terms" },
  twitter: { card: "summary_large_image", title, description },
};

export default function TermsPage() {
  return (
    <InfoPage
      path="/terms"
      title="Terms & Conditions"
      intro="These terms govern access to Dolphub and the portfolio pages students publish through the service. By using Dolphub, you agree to follow them."
    >
      <InfoSection id="service" title="The service">
        <p>
          Dolphub gives eligible PCU tech students a public portfolio page for their projects and links.
          It is not a marketplace, employer, recruiter, payment service, or guarantee of an academic or
          career opportunity.
        </p>
      </InfoSection>

      <InfoSection id="accounts" title="Accounts and eligibility">
        <InfoList>
          <li>Use only a PCU email address that belongs to you and keep access to sign-in links private.</li>
          <li>Provide accurate information and use the service only for a genuine student portfolio.</li>
          <li>You are responsible for activity performed through your account and public page.</li>
          <li>Tell support promptly if you believe someone else has accessed your account.</li>
        </InfoList>
      </InfoSection>

      <InfoSection id="content" title="Your content">
        <p>
          You keep ownership of content you submit. You give Dolphub a non-exclusive, worldwide,
          royalty-free license to store, process, resize, cache, display, and make technical copies of
          that content only as needed to operate, secure, and share your portfolio and its previews.
          This license ends when the content is deleted, except for temporary cached or backup copies.
        </p>
        <p>
          Submit only content you created or have permission to use. You are responsible for the
          accuracy of your page and for obtaining permission before publishing another person&apos;s name,
          image, work, or contact information.
        </p>
      </InfoSection>

      <InfoSection id="acceptable-use" title="Acceptable use">
        <p>Do not use Dolphub to:</p>
        <InfoList>
          <li>Impersonate another person or misrepresent your identity, course, work, or affiliation.</li>
          <li>Publish unlawful, infringing, deceptive, harassing, hateful, or sexually explicit content.</li>
          <li>Expose private or sensitive information without the affected person&apos;s permission.</li>
          <li>Upload malware or attempt to bypass security, rate limits, access controls, or moderation.</li>
          <li>Scrape, overload, disrupt, or test the live service without written authorization.</li>
        </InfoList>
      </InfoSection>

      <InfoSection id="public-pages" title="Public pages and outside links">
        <p>
          Published pages are public. Search visibility controls indexing, not access through a direct
          URL. Do not publish secrets or contact details you do not want visitors to see.
        </p>
        <p>
          Project, Messenger, GitHub, and other outside links are controlled by third parties. Dolphub
          does not endorse their content and is not responsible for their availability, privacy, safety,
          or any arrangement you make outside Dolphub.
        </p>
      </InfoSection>

      <InfoSection id="moderation" title="Moderation and account removal">
        <p>
          Dolphub may hide or remove content, freeze sign-ups, limit access, or suspend an account when
          reasonably needed to protect people, enforce these terms, comply with law, or keep the service
          reliable. When practical, Dolphub will explain the reason and provide a way to contact support.
        </p>
        <p>
          You may ask to correct your page or delete your account by emailing{" "}
          <SupportContacts subject="Dolphub account request" />
          . Account deletion removes the profile, projects, and stored images, subject to limited audit
          records described in the privacy notice.
        </p>
      </InfoSection>

      <InfoSection id="availability" title="Availability and disclaimers">
        <p>
          Dolphub is provided on an “as available” basis. Features may change, pause, or stop, and the
          service may occasionally lose access to third-party hosting, email, database, or storage
          providers. To the extent permitted by law, no warranty is made that Dolphub will be
          uninterrupted, error-free, or suitable for a particular result.
        </p>
      </InfoSection>

      <InfoSection id="liability" title="Limits of responsibility">
        <p>
          To the fullest extent allowed by law, Dolphub&apos;s contributors are not responsible for indirect,
          incidental, special, or consequential loss caused by use of the service, public student
          content, outside links, or service interruption. Nothing in these terms excludes rights or
          responsibility that Philippine law does not allow to be excluded.
        </p>
      </InfoSection>

      <InfoSection id="changes" title="Changes and governing law">
        <p>
          Material changes will be posted here with a new date and an appropriate notice. These terms
          are governed by the laws of the Republic of the Philippines. Questions about the terms can be
          sent to <SupportContacts subject="Dolphub terms" />
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
