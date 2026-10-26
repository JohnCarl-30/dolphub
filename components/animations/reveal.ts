import type { CSSProperties } from "react";

/** Offset cards that enter together without stretching long lists indefinitely. */
export function revealStyle(index = 0): CSSProperties {
  const offset = Math.min(4, Math.max(0, index)) * 2.5;
  return {
    "--reveal-start": `${5 + offset}%`,
    "--reveal-end": `${30 + offset}%`,
  } as CSSProperties;
}
