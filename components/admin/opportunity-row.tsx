"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteOpportunityAction, setOpportunityHiddenAction } from "@/app/admin/opportunities/actions";
import type { ActionResult } from "@/lib/actions/result";
import { KIND_NAMES } from "@/lib/mock-home";
import { closingLabel } from "@/lib/opportunity-time";
import { opportunityPath } from "@/lib/seo";
import type { AdminOpportunity } from "@/lib/services/opportunities";
import { dangerButton, inlineLink, inputClass, labelClass, secondaryButton } from "./styles";

type Mode = "idle" | "hiding" | "deleting";

/** One post in the admin list: edit, hide or restore, and delete with a confirmation step. */
export function OpportunityRow({ post }: { post: AdminOpportunity }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const reasonId = `hide-post-${post.id}`;
  const status = post.isHidden ? "Hidden" : closingLabel(post.closesAt);

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
      router.refresh();
    });
  }

  function cancel() {
    setMode("idle");
    setError(null);
  }

  return (
    <article aria-label={post.title} className="grid gap-3 border border-ink/10 px-4 py-4">
      <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wide">
        <span className="text-muted">{KIND_NAMES[post.kind]}</span>
        <span className="text-ink">{status}</span>
      </p>
      <div>
        <h3 className="text-lg font-medium tracking-tight [overflow-wrap:anywhere]">{post.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted">{post.organization}</p>
      </div>
      {post.isHidden && post.hiddenReason ? <p className="text-sm leading-6">Reason: {post.hiddenReason}</p> : null}

      {mode === "hiding" ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => setOpportunityHiddenAction(post.id, true, reason));
          }}
        >
          <label htmlFor={reasonId} className={labelClass}>
            Why hide this post?
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
            Only admins see this, for example &quot;event cancelled&quot; or &quot;asks students to pay&quot;.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className={dangerButton}>
              {pending ? "Hiding…" : "Hide post"}
            </button>
            <button type="button" onClick={cancel} className={secondaryButton}>
              Cancel
            </button>
          </div>
        </form>
      ) : mode === "deleting" ? (
        <div role="group" aria-label="Confirm delete" className="grid gap-2 border border-red-700 px-4 py-4">
          <p className="text-sm leading-6">
            Delete this post for good? Its link stops working. Hiding keeps the post so you can restore it.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteOpportunityAction(post.id, true))}
              className={dangerButton}
            >
              {pending ? "Deleting…" : "Delete for good"}
            </button>
            <button type="button" onClick={cancel} className={secondaryButton}>
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/opportunities/${post.id}`} className={secondaryButton}>
            Edit<span className="sr-only"> {post.title}</span>
          </Link>
          {post.isHidden ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setOpportunityHiddenAction(post.id, false))}
              className={secondaryButton}
            >
              {pending ? "Restoring…" : "Restore"}
              <span className="sr-only"> {post.title}</span>
            </button>
          ) : (
            <button type="button" onClick={() => setMode("hiding")} className={secondaryButton}>
              Hide<span className="sr-only"> {post.title}</span>
            </button>
          )}
          <button type="button" onClick={() => setMode("deleting")} className={secondaryButton}>
            Delete<span className="sr-only"> {post.title}</span>
          </button>
          {post.isHidden ? null : (
            <Link href={opportunityPath(post.slug)} className={`ml-auto font-mono text-[11px] uppercase tracking-wide ${inlineLink}`}>
              View<span className="sr-only"> {post.title}</span> <span aria-hidden="true">→</span>
            </Link>
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
