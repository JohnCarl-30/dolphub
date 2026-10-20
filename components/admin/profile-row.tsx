"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { hideProfileAction, unhideProfileAction } from "@/app/admin/actions";
import type { AdminProfile } from "@/lib/admin";
import { formatManilaDate } from "@/lib/opportunity-time";
import { profilePath } from "@/lib/seo";
import { dangerButton, inlineLink, inputClass, labelClass, secondaryButton } from "./styles";

/** One student page in the admin list, with hide and restore. */
export function ProfileRow({ profile }: { profile: AdminProfile }) {
  const router = useRouter();
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reasonId = `hide-reason-${profile.handle}`;

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setHiding(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <article aria-label={`/u/${profile.handle}`} className="grid gap-3 border border-ink/10 px-4 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-medium [overflow-wrap:anywhere]">
          <Link href={profilePath(profile.handle)} className={inlineLink}>
            /u/{profile.handle}
          </Link>
        </h3>
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink">{profile.isHidden ? "Hidden" : "Visible"}</p>
      </div>
      <p className="text-sm leading-6 text-muted">
        {profile.displayName} · {profile.projectCount} {profile.projectCount === 1 ? "project" : "projects"} · joined{" "}
        {formatManilaDate(profile.createdAt)}
      </p>
      {profile.isHidden && profile.hiddenReason ? (
        <p className="text-sm leading-6">Reason: {profile.hiddenReason}</p>
      ) : null}

      {hiding ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => hideProfileAction(profile.handle, reason));
          }}
        >
          <label htmlFor={reasonId} className={labelClass}>
            Why hide this page?
          </label>
          <input
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            maxLength={300}
            autoFocus
            aria-describedby={`${reasonId}-hint`}
            className={inputClass}
          />
          <p id={`${reasonId}-hint`} className="text-xs leading-5 text-muted">
            The student can see this reason. Keep it short and factual.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className={dangerButton}>
              {pending ? "Hiding…" : "Hide page"}
            </button>
            <button
              type="button"
              onClick={() => {
                setHiding(false);
                setError(null);
              }}
              className={secondaryButton}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {profile.isHidden ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => unhideProfileAction(profile.handle))}
              className={secondaryButton}
            >
              {pending ? "Restoring…" : "Restore"}
              <span className="sr-only"> /u/{profile.handle}</span>
            </button>
          ) : (
            <button type="button" onClick={() => setHiding(true)} className={secondaryButton}>
              Hide<span className="sr-only"> /u/{profile.handle}</span>
            </button>
          )}
        </div>
      )}
      {error ? (
        <p role="alert" className="rise text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </article>
  );
}
