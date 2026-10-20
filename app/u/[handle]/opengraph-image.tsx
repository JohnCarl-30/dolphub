import { ImageResponse } from "next/og";
import { getSeoProfile } from "@/lib/seo-data";
import { clip, SHARE_CARD_SIZE, ShareCard } from "@/lib/share-card";

export const alt = "A student's portfolio page on Dolphub";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

/** The preview shown when a student's link is shared in Messenger or Facebook. */
export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getSeoProfile(handle);
  return new ImageResponse(
    profile ? (
      <ShareCard
        eyebrow={profile.courseName}
        title={clip(profile.displayName, 40)}
        subtitle={clip(profile.tagline || `See ${profile.displayName}'s projects.`, 110)}
      />
    ) : (
      <ShareCard eyebrow="Dolphub" title="Page not found" subtitle="This student page doesn't exist yet." />
    ),
    size,
  );
}
