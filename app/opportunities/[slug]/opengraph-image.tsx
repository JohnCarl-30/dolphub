import { ImageResponse } from "next/og";
import { getOpportunityPage } from "@/lib/opportunities";
import { closingLabel } from "@/lib/opportunity-time";
import { KIND_LABELS } from "@/lib/services/opportunities";
import { clip, SHARE_CARD_SIZE, ShareCard } from "@/lib/share-card";

export const alt = "An opportunity for PCU tech students on Dolphub";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

/** The preview shown when a post is shared in Messenger or Facebook. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = await getOpportunityPage(slug);
  return new ImageResponse(
    o ? (
      <ShareCard
        eyebrow={`${KIND_LABELS[o.kind].one} · ${closingLabel(o.closesAt)}`}
        title={clip(o.title, 60)}
        subtitle={clip(o.location ? `${o.organization} · ${o.location}` : o.organization, 90)}
        badge={o.isClosed ? "Closed" : undefined}
      />
    ) : (
      <ShareCard eyebrow="Opportunities" title="Not found" subtitle="This opportunity was removed." />
    ),
    size,
  );
}
