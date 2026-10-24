import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info-page";
import { OG_DEFAULTS } from "@/lib/seo";

const title = "About Dolphub";
const description = "Dolphub helps PCU IT, Computer Science, and Computer Engineering students make their practical work easier to find.";
export const metadata: Metadata = { title, description, alternates: { canonical: "/about" }, openGraph: { ...OG_DEFAULTS, title, description, url: "/about" } };

export default function AboutPage() {
  return <InfoPage path="/about" title={title} intro={description}>
    <InfoSection id="audience" title="Built for PCU tech students"><p>Dolphub is for students in Information Technology, Computer Science, and Computer Engineering who want a clear way to present practical work.</p></InfoSection>
    <InfoSection id="purpose" title="Make work discoverable"><p>It keeps student projects in one place so classmates, employers, and collaborators can see what people are building.</p></InfoSection>
  </InfoPage>;
}
