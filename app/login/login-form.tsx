"use client";

import { useActionState } from "react";
import { requestLinkAction, type LoginState } from "./actions";

/** `next` is a path to open after sign-in, carried in the emailed link. */
export function LoginForm({ next }: { next: string | null }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLinkAction, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <div role="status" className="rise border border-ink/10 bg-paper p-4">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          We sent a sign-in link to {state.email}. It expires in 15 minutes. If you can&apos;t find it, check
          your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-wide text-muted">
        PCU email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@pcu.edu.ph"
        defaultValue={state.status === "error" ? state.email : ""}
        className="h-12 border border-ink/15 bg-white px-3 text-base outline-none transition-colors hover:border-ink/40 focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink"
      />
      {state.status === "error" && (
        <p role="alert" className="rise text-sm text-red-700">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="press h-12 border border-ink bg-ink font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
