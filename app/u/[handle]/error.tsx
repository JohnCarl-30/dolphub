"use client";

import { ErrorFallbackPanel } from "@/components/content-error-boundary";

export default function ProfileError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorFallbackPanel
      eyebrow="/u"
      title="This student page is temporarily unavailable."
      description="The page could not be loaded right now. Please try again shortly."
      variant="page"
      showHomeLink
      onRetry={retry}
    />
  );
}
