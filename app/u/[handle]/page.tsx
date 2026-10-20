import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { notFound } from "next/navigation";
import { getProfilePage } from "@/lib/profiles";
import { isIndexable, missingProfileMetadata, profileMetadata, profilePageJsonLd, siteUrl } from "@/lib/seo";
import { getSeoProfile } from "@/lib/seo-data";
import { Suspense } from "react";
import { ProfilePage } from "./profile-page";

/**
 * Cache Components needs one param at build time to prerender the page shell.
 * Builds run without a database, so this is a placeholder: every real page,
 * including this handle, is still read per request inside the Suspense boundary.
 */
export function generateStaticParams() {
  return [{ handle: "placeholder" }];
}

export async function generateMetadata({ params }: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getSeoProfile(handle);
  return profile ? profileMetadata(profile) : missingProfileMetadata();
}

export default function Page({ params }: PageProps<"/u/[handle]">) {
  return (
    <Suspense
      fallback={
        <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/u</p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight">Loading page…</h1>
        </section>
      }
    >
      <ResolvedProfile params={params} />
    </Suspense>
  );
}

async function ResolvedProfile({
  params,
}: {
  params: PageProps<"/u/[handle]">["params"];
}) {
  const { handle } = await params;
  const profile = await getProfilePage(handle);
  if (!profile) notFound();
  // Structured data only for pages search engines may index.
  const seo = await getSeoProfile(handle);
  return (
    <>
      {seo && isIndexable(seo) ? <JsonLd data={profilePageJsonLd(seo, siteUrl())} /> : null}
      <ProfilePage profile={profile} />
    </>
  );
}
