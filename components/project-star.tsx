"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setProjectStarAction } from "@/app/project-stars/actions";

const pillClassName =
  "press inline-flex min-w-[8rem] items-center justify-center gap-2 border border-ink px-3 py-1.5 text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";

export function ProjectStar({
  projectId,
  count,
  starred,
  canStar,
  signedIn,
}: {
  projectId: string;
  count: number;
  starred: boolean;
  canStar: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState({ count, starred });
  const [error, setError] = useState<string | null>(null);

  if (!canStar) {
    if (signedIn) {
      return (
        <span className="inline-flex items-center gap-2 text-muted">
          <span aria-hidden="true">★</span>
          <span className="tabular-nums">{count}</span>
        </span>
      );
    }
    return (
      <Link
        href="/login"
        aria-label={`Star project (${count})`}
        className={`${pillClassName} hover:bg-ink hover:text-paper`}
      >
        <span aria-hidden="true">☆</span>
        <span>Star</span>
        <span className="min-w-[3ch] text-right tabular-nums">{count}</span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        aria-pressed={state.starred}
        aria-label={state.starred ? `Remove star (${state.count})` : `Star project (${state.count})`}
        className={`${pillClassName} ${state.starred ? "bg-ink text-paper hover:bg-paper hover:text-ink" : "hover:bg-ink hover:text-paper"} disabled:cursor-wait disabled:opacity-60`}
        onClick={() => {
          const next = !state.starred;
          setError(null);
          startTransition(async () => {
            const result = await setProjectStarAction(projectId, next);
            if (result.ok) {
              setState({ count: result.data.starCount, starred: result.data.starred });
              router.refresh();
            } else {
              setError(result.error);
            }
          });
        }}
      >
        <span aria-hidden="true">{state.starred ? "★" : "☆"}</span>
        <span>{state.starred ? "Starred" : "Star"}</span>
        <span className="min-w-[3ch] text-right tabular-nums">{state.count}</span>
      </button>
      {error ? <span role="status" className="normal-case text-muted">{error}</span> : null}
    </>
  );
}
