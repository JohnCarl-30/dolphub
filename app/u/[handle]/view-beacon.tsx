"use client";

import { useEffect } from "react";

export function ViewBeacon({ handle }: { handle: string }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref") ?? undefined;
    try {
      navigator.sendBeacon("/api/track/view", new Blob([JSON.stringify({ handle, ref })], { type: "application/json" }));
    } catch {
      // Analytics is best effort.
    }
    if (url.searchParams.has("ref")) {
      url.searchParams.delete("ref");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [handle]);
  return null;
}
