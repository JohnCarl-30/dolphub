"use client";

import { useActionState } from "react";
import { mockAdminSignInAction, type MockAdminState } from "./actions";

const inputClass =
  "h-12 border border-ink/15 bg-white px-3 text-base outline-none transition-colors hover:border-ink/40 focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink";
const labelClass = "font-mono text-[11px] uppercase tracking-wide text-muted";

/** Local development only. The login page renders this only when mockAdminEnabled is true. */
export function MockAdminForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<MockAdminState, FormData>(mockAdminSignInAction, { error: null });

  return (
    <section aria-labelledby="mock-admin-heading" className="mt-10 border border-dashed border-ink/30 p-4">
      <h2 id="mock-admin-heading" className="font-medium">
        Local mock admin
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Only on your machine with the local database. It does not exist on the live site.
      </p>
      <form action={action} className="mt-4 flex flex-col gap-3">
        <label htmlFor="mock-admin-email" className={labelClass}>
          Email
        </label>
        <input id="mock-admin-email" name="email" type="email" defaultValue={email} autoComplete="off" className={inputClass} />
        <label htmlFor="mock-admin-password" className={labelClass}>
          Password
        </label>
        <input id="mock-admin-password" name="password" type="password" autoComplete="off" className={inputClass} />
        {state.error ? (
          <p role="alert" className="rise text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="press h-12 border border-ink/15 bg-white font-mono text-[11px] uppercase tracking-wide text-ink outline-none transition-colors hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in as admin"}
        </button>
      </form>
    </section>
  );
}
