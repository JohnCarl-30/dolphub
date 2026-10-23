"use client";

import Link from "next/link";
import { useActionState } from "react";
import { withNext } from "@/lib/next-path";
import { verifyAction, type VerifyState } from "../actions";

/** `next` is where to go after sign-in, carried over from the emailed link. */
export function VerifyForm({ token, next }: { token: string; next: string | null }) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(verifyAction, { error: null });

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <button
        type="submit"
        disabled={pending}
        className="press h-12 border border-ink bg-ink font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Continue to PCU Community"}
      </button>
      {state.error && (
        <p role="alert" className="rise text-sm text-red-700">
          {state.error}{" "}
          <Link href={withNext("/login", next)} className="underline underline-offset-4 transition-colors hover:text-ink">
            Get a new link
          </Link>
        </p>
      )}
    </form>
  );
}
