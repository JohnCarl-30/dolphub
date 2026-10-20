import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { getShowcase } from "@/lib/profiles";
import { OG_DEFAULTS, SITE, siteUrl, websiteJsonLd } from "@/lib/seo";
import { HomePage } from "./home-page";

export const metadata: Metadata = {
  title: { absolute: SITE.title },
  alternates: { canonical: "/" },
  openGraph: { ...OG_DEFAULTS, title: SITE.title, description: SITE.description, url: "/" },
};

export default function Home() {
  return (
    <>
      <JsonLd data={websiteJsonLd(siteUrl())} />
      {/* Not awaited: the hero renders at once and the showcase streams in. */}
      <HomePage showcase={getShowcase()} />
    </>
  );
}
