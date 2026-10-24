import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info-page";
import { OG_DEFAULTS } from "@/lib/seo";

const title = "Vision";
const description = "Dolphub's vision is for every PCU tech student to leave with a visible, useful, and shareable portfolio.";
export const metadata: Metadata = { title, description, alternates: { canonical: "/vision" }, openGraph: { ...OG_DEFAULTS, title, description, url: "/vision" } };

export default function VisionPage() {
  return <InfoPage path="/vision" title={title} intro={description}>
    <InfoSection id="visibility" title="Work should travel"><p>A student&apos;s strongest projects should be easy to share with the people who can learn from them, build with them, or offer the next opportunity.</p></InfoSection>
    <InfoSection id="community" title="A growing student showcase"><p>As students publish and star each other&apos;s work, Dolphub becomes a living picture of what PCU tech students can make.</p></InfoSection>
  </InfoPage>;
}
