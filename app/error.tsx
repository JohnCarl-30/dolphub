"use client";

import { ErrorFallbackPanel } from "@/components/content-error-boundary";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorFallbackPanel
      eyebrow="/error"
      title="This page is temporarily unavailable."
      description="Please try again shortly. The rest of Dolphub is still available."
      variant="page"
      showHomeLink
      onRetry={retry}
    />
  );
}
