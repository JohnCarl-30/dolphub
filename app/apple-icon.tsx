import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SITE.colors.ink,
          color: SITE.colors.background,
          fontSize: 120,
          fontWeight: 700,
          borderRadius: 36,
        }}
      >
        D
      </div>
    ),
    size,
  );
}
