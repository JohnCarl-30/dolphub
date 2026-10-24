import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { getShowcase } from "@/lib/profiles";
import { OG_DEFAULTS, SITE, siteUrl, websiteJsonLd } from "@/lib/seo";
import { LandingPage } from "./landing-page";

export const metadata: Metadata = {
  title: { absolute: SITE.title },
  alternates: { canonical: "/" },
  openGraph: { ...OG_DEFAULTS, title: SITE.title, description: SITE.description, url: "/" },
};

export default async function Page() {
  return (
    <>
      <JsonLd data={websiteJsonLd(siteUrl())} />
      <LandingPage showcase={await getShowcase()} />
    </>
  );
}
