import { SITE } from "./seo";

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

/**
 * The 1200x630 link preview drawn by next/og. Satori only lays out flexbox,
 * so every element with more than one child sets display: flex.
 */
export function ShareCard({
  eyebrow,
  title,
  subtitle,
  badge,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  const { colors } = SITE;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: colors.paper,
        color: colors.ink,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: colors.ink,
              color: colors.background,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>{SITE.name}</div>
        </div>
        {badge ? (
          <div
            style={{
              display: "flex",
              fontSize: 24,
              padding: "8px 18px",
              borderRadius: 999,
              border: `2px solid ${colors.muted}`,
              color: colors.muted,
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 28, color: colors.accent, fontWeight: 600 }}>{eyebrow}</div>
        <div style={{ fontSize: title.length > 24 ? 64 : 80, fontWeight: 700, lineHeight: 1.05 }}>{title}</div>
        <div style={{ fontSize: 34, color: colors.muted, lineHeight: 1.3 }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", fontSize: 26, color: colors.muted }}>dolphub.tech</div>
    </div>
  );
}

/** Keeps long student text from overflowing the card. */
export function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}
