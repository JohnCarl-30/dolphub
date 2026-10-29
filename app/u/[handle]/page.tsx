import type { Metadata } from "next";
import { ContentErrorBoundary } from "@/components/content-error-boundary";
import { JsonLd } from "@/lib/json-ld";
import { notFound } from "next/navigation";
import { getProfilePage } from "@/lib/profiles";
import { getCurrentUser } from "@/lib/auth";
import { isIndexable, missingProfileMetadata, profileMetadata, profilePageJsonLd, siteUrl } from "@/lib/seo";
import { getSeoProfile } from "@/lib/seo-data";
import { getServiceContext } from "@/lib/server";
import { starredProjectIds } from "@/lib/services/project-stars";
import { getProfileByUserId } from "@/lib/services/profiles";
import { Suspense } from "react";
import { ProfilePage } from "./profile-page";
import { ViewBeacon } from "./view-beacon";

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
    <ContentErrorBoundary
      eyebrow="/u"
      title="This student page is temporarily unavailable."
      description="The page could not be loaded right now. Please try again shortly."
      variant="page"
      showHomeLink
    >
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
    </ContentErrorBoundary>
  );
}

async function ResolvedProfile({
  params,
}: {
  params: PageProps<"/u/[handle]">["params"];
}) {
  const { handle } = await params;
  const [profile, user] = await Promise.all([getProfilePage(handle), getCurrentUser()]);
  if (!profile) notFound();
  const ownProfile = user ? await getProfileByUserId((await getServiceContext()).db, user.id) : null;
  const starred = user && profile.starsAvailable
    ? await starredProjectIds((await getServiceContext()).db, user.id, profile.projects.map((project) => project.id))
    : new Set<string>();
  // Structured data only for pages search engines may index.
  const seo = await getSeoProfile(handle);
  return (
    <>
      <ViewBeacon handle={profile.handle} />
      {seo && isIndexable(seo) ? <JsonLd data={profilePageJsonLd(seo, siteUrl())} /> : null}
      <ProfilePage
        profile={profile}
        starredProjectIds={starred}
        signedIn={Boolean(user)}
        isOwner={ownProfile?.handle === profile.handle}
      />
    </>
  );
}
