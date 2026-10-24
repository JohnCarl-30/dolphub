"use client";

import Link from "next/link";
import { catchError, type ErrorInfo } from "next/error";

interface ContentErrorBoundaryProps {
  eyebrow?: string;
  title: string;
  description: string;
  variant?: "inline" | "page";
  showHomeLink?: boolean;
}

export function ErrorFallbackPanel({
  eyebrow,
  title,
  description,
  variant = "inline",
  showHomeLink = false,
  onRetry,
}: ContentErrorBoundaryProps & { onRetry: () => void }) {
  const content = (
    <div role="alert" className={variant === "inline" ? "mt-5 border border-ink/10 bg-paper p-5" : undefined}>
      {eyebrow ? <p className="font-mono text-[11px] uppercase tracking-wide text-muted">{eyebrow}</p> : null}
      <h2 className={`${eyebrow ? "mt-3" : ""} text-2xl font-medium tracking-tight`}>{title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{description}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="press inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink"
        >
          Try again
        </button>
        {showHomeLink ? (
          <Link
            href="/"
            className="press inline-flex min-h-11 items-center border border-ink/10 bg-background px-4 py-2 font-mono text-[11px] uppercase tracking-wide outline-none hover:bg-paper focus-visible:ring-2 focus-visible:ring-ink"
          >
            Back to Dolphub
          </Link>
        ) : null}
      </div>
    </div>
  );

  if (variant === "page") {
    return <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">{content}</section>;
  }
  return content;
}

function ContentErrorFallback(props: ContentErrorBoundaryProps, { retry }: ErrorInfo) {
  return <ErrorFallbackPanel {...props} onRetry={retry} />;
}

/** Granular Next-aware boundary for streamed Server Component content. */
export const ContentErrorBoundary = catchError(ContentErrorFallback);
