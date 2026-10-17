"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useMockStore } from "./mock-store";

const HANDLE = /^[a-z0-9-]{2,30}$/;

/** The closing sentence with a blank in it. The blank is the handle; the last word is the button. */
export function ClaimHandle() {
  const { profiles } = useMockStore();
  const [value, setValue] = useState("");
  const id = useId();
  const handle = value.trim().toLowerCase();
  const taken = profiles.find((profile) => profile.handle === handle);
  const valid = HANDLE.test(handle);

  let status: string;
  if (!handle) status = "Letters, numbers and hyphens. It becomes dolphub.tech/u/your-handle.";
  else if (taken) status = `dolphub.tech/u/${handle} is already ${taken.displayName}'s page.`;
  else if (!valid) status = "Two to thirty letters, numbers or hyphens.";
  else status = `dolphub.tech/u/${handle} is free. Claim it on the dashboard.`;

  return (
    <section aria-labelledby={`${id}-heading`} className="bg-paper px-margin py-24 sm:py-32">
      <h2 id={`${id}-heading`} className="sr-only">
        Claim your handle
      </h2>
      <form
        action="/dashboard"
        method="get"
        onSubmit={(event) => {
          if (!valid || taken) event.preventDefault();
        }}
        className="max-w-[26ch] text-statement font-medium"
        data-reveal
      >
        <label htmlFor={`${id}-handle`}>Your page will live at </label>
        <span className="whitespace-nowrap">
          /u/
          <input
            id={`${id}-handle`}
            name="handle"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="your-handle"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            maxLength={30}
            className="claim-input"
          />
        </span>{" "}
        <span>so </span>
        <button type="submit" className="claim-submit press" disabled={!valid || !!taken}>
          claim it
        </button>
      </form>
      <p aria-live="polite" className="mt-6 max-w-[52ch] text-note text-muted" data-reveal style={{ "--i": 1 } as React.CSSProperties}>
        {taken ? (
          <>
            {status}{" "}
            <Link href={`/u/${taken.handle}`} className="text-ink underline underline-offset-4">
              Open it
            </Link>
            .
          </>
        ) : (
          status
        )}
      </p>
    </section>
  );
}
