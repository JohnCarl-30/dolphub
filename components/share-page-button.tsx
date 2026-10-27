"use client";

import { useState } from "react";

/** Opens the phone's share sheet for the student's page, or copies the link where sharing isn't available. */
export function SharePageButton({ path, name }: { path: string; name: string }) {
  const [status, setStatus] = useState("");

  async function share() {
    const url = new URL(path, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} on Dolphub`, url });
        return;
      } catch (error) {
        // Closing the share sheet is not a failure. Anything else falls back to copying.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied.");
    } catch {
      setStatus("Couldn't copy. Press and hold the link to copy it.");
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={share}
        className="press inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink"
      >
        Share my page
      </button>
      <p role="status" className="text-xs leading-5 text-muted">
        {status}
      </p>
    </div>
  );
}
