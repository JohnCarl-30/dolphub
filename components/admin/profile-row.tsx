"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAccountAction, hideProfileAction, unhideProfileAction } from "@/app/admin/actions";
import type { ActionResult } from "@/lib/actions/result";
import type { AdminProfile } from "@/lib/admin";
import { formatManilaDate } from "@/lib/opportunity-time";
import { profilePath } from "@/lib/seo";
import { dangerButton, inlineLink, inputClass, labelClass, secondaryButton } from "./styles";

type Mode = "idle" | "hiding" | "deleting";

/** One student page in the admin list: hide or restore, and delete the account after typing its handle. */
export function ProfileRow({ profile }: { profile: AdminProfile }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [reason, setReason] = useState("");
  const [typedHandle, setTypedHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reasonId = `hide-reason-${profile.handle}`;
  const confirmId = `delete-confirm-${profile.handle}`;
  const handleTyped = typedHandle.trim().toLowerCase() === profile.handle;

  function run(action: () => Promise<ActionResult<unknown>>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setMode("idle");
      setReason("");
      setTypedHandle("");
      router.refresh();
    });
  }

  function cancel() {
    setMode("idle");
    setTypedHandle("");
    setError(null);
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

      {mode === "hiding" ? (
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
            <button type="button" onClick={cancel} className={secondaryButton}>
              Cancel
            </button>
          </div>
        </form>
      ) : mode === "deleting" ? (
        <form
          aria-label="Confirm delete"
          className="grid gap-2 border border-red-700 px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => deleteAccountAction(profile.handle, typedHandle));
          }}
        >
          <p className="text-sm leading-6">
            Delete this student&apos;s account for good? Their page, projects and photos are removed and cannot be
            restored. Hiding keeps everything so you can bring the page back.
          </p>
          <label htmlFor={confirmId} className={labelClass}>
            Type {profile.handle} to confirm
          </label>
          <input
            id={confirmId}
            value={typedHandle}
            onChange={(event) => setTypedHandle(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            className={inputClass}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending || !handleTyped} className={dangerButton}>
              {pending ? "Deleting…" : "Delete for good"}
            </button>
            <button type="button" onClick={cancel} className={secondaryButton}>
              Keep it
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
            <button type="button" onClick={() => setMode("hiding")} className={secondaryButton}>
              Hide<span className="sr-only"> /u/{profile.handle}</span>
            </button>
          )}
          <button type="button" onClick={() => setMode("deleting")} className={secondaryButton}>
            Delete<span className="sr-only"> /u/{profile.handle}</span>
          </button>
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
