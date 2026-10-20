"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setSignupsFrozenAction } from "@/app/admin/actions";
import { inputClass, labelClass, primaryButton, secondaryButton } from "./styles";

/** The signup kill switch. Pausing stops new accounts; everyone with an account can still sign in. */
export function SignupSwitch({ frozen }: { frozen: boolean }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setSignupsFrozenAction(!frozen, frozen ? undefined : reason);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 border border-ink/10 bg-paper px-4 py-5">
      <div role="status">
        <p className="font-medium">{frozen ? "Signups are paused" : "Signups are open"}</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          {frozen
            ? "New students can't create an account. Everyone who already has one can still sign in."
            : "Any PCU tech student can create an account."}
        </p>
      </div>
      {frozen ? null : (
        <div className="grid gap-2">
          <label htmlFor="freeze-reason" className={labelClass}>
            Reason, optional
          </label>
          <input
            id="freeze-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={300}
            aria-describedby="freeze-reason-hint"
            className={inputClass}
          />
          <p id="freeze-reason-hint" className="text-xs leading-5 text-muted">
            Kept in the audit log, for example &quot;spam signups&quot;.
          </p>
        </div>
      )}
      {error ? (
        <p role="alert" className="rise text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`${frozen ? primaryButton : secondaryButton} justify-self-start`}
      >
        {pending ? "Saving…" : frozen ? "Resume signups" : "Pause signups"}
      </button>
    </div>
  );
}
