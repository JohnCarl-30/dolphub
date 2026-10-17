"use client";

import Link from "next/link";
import { useActionState } from "react";
import { verifyAction, type VerifyState } from "../actions";

export function VerifyForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(verifyAction, { error: null });

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-lg bg-zinc-900 text-base font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Signing in…" : "Continue to PCU Community"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}{" "}
          <Link href="/login" className="underline">
            Get a new link
          </Link>
        </p>
      )}
    </form>
  );
}
