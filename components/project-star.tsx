"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setProjectStarAction } from "@/app/project-stars/actions";

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
    if (signedIn) return <span>★ {count}</span>;
    return (
      <Link href="/login" className="outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink">
        ★ {count} · Log in to star
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        aria-pressed={state.starred}
        aria-label={state.starred ? "Remove star from project" : "Star project"}
        className="outline-none transition-colors hover:text-muted disabled:cursor-wait focus-visible:ring-2 focus-visible:ring-ink"
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
        ★ {state.count} · {state.starred ? "Starred" : "Star"}
      </button>
      {error ? <span role="status">{error}</span> : null}
    </>
  );
}
