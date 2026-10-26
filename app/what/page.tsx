import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info-page";
import { OG_DEFAULTS } from "@/lib/seo";

const title = "What is Dolphub?";
const description = "A public portfolio space for PCU tech students to share the projects they build.";
export const metadata: Metadata = { title, description, alternates: { canonical: "/what" }, openGraph: { ...OG_DEFAULTS, title, description, url: "/what" } };

export default function WhatPage() {
  return <InfoPage path="/what" title={title} intro={description} motion>
    <InfoSection id="portfolio" title="One public link" motion><p>Every student can publish a page at <code>/u/your-handle</code> for projects, screenshots, demos, source links, and contact details they choose to share.</p></InfoSection>
    <InfoSection id="showcase" title="Projects worth seeing" motion><p>Students can star work they find useful or impressive. The public landing page highlights projects with the most stars while making room for new work too.</p></InfoSection>
  </InfoPage>;
}
