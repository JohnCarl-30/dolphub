import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo";
import { SHARE_CARD_SIZE, ShareCard } from "@/lib/share-card";

export const alt = SITE.title;
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

/** Default link preview for every page without its own. */
export default function Image() {
  return new ImageResponse(
    (
      <ShareCard
        eyebrow="For PCU IT, CS and Computer Engineering students"
        title="One link for every project you've built."
        subtitle="Portfolio pages for PCU tech students."
      />
    ),
    size,
  );
}
