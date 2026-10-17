"use client";

import { useActionState } from "react";
import { requestLinkAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLinkAction, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          We sent a sign-in link to {state.email}. It expires in 15 minutes. If you can&apos;t find it, check
          your spam folder.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium">
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
        className="h-12 rounded-lg border border-zinc-300 px-3 text-base dark:border-zinc-700 dark:bg-zinc-900"
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-lg bg-zinc-900 text-base font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
