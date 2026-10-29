"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

export function AnalyticsLink({ kind, targetId, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { kind: "demo" | "source" | "github" | "messenger" | "email"; targetId: string }) {
  function track(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    try { navigator.sendBeacon("/api/track/click", new Blob([JSON.stringify({ kind, targetId })], { type: "application/json" })); } catch { /* best effort */ }
  }
  return <a {...props} onClick={track} />;
}
