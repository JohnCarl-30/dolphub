"use client";

import { useEffect, useId, useState } from "react";
import type { OpportunityKind } from "@/lib/services/opportunities";
import { contactEmail } from "@/lib/services/validation";

const NEWSLETTER_TOPICS: { id: OpportunityKind; label: string }[] = [
  { id: "internship", label: "Internships" },
  { id: "event", label: "Events" },
  { id: "competition", label: "Competitions" },
  { id: "program", label: "Programs" },
];

const STORAGE_KEY = "dolphub-mock-newsletter";

type Saved = { email: string; topics: OpportunityKind[] };

/** Mock signup: validates like the server would and remembers the choice in this tab only. */
export function NewsletterSignup() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [topics, setTopics] = useState<OpportunityKind[]>(["internship", "event"]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      // Session storage only exists in the browser, after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSaved(JSON.parse(raw) as Saved);
    } catch {
      /* A missing or corrupt entry just shows the form. */
    }
  }, []);

  function toggle(topic: OpportunityKind) {
    setTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic],
    );
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = contactEmail.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    if (topics.length === 0) {
      setError("Pick at least one kind of post to hear about.");
      return;
    }
    const next = { email: parsed.data, topics };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Keep the in-memory state. */
    }
    setError(null);
    setSaved(next);
  }

  function reset() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Nothing stored. */
    }
    setSaved(null);
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/newsletter</p>
      <div className="mt-3 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <h2 id={`${id}-heading`} className="text-3xl font-medium tracking-tight">
            Get new posts by email
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            One short email on Mondays with the internships and events posted that week. Nothing
            is sent in this mock.
          </p>
        </div>

        {saved ? (
          <div role="status" className="rise self-start border border-ink/10 bg-paper p-4">
            <p className="font-medium">You are on the list</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              We will email {saved.email} about{" "}
              {NEWSLETTER_TOPICS.filter((topic) => saved.topics.includes(topic.id))
                .map((topic) => topic.label.toLowerCase())
                .join(", ")}
              .
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-2 text-sm underline underline-offset-4 outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <fieldset>
              <legend className="font-mono text-[11px] uppercase tracking-wide text-muted">What to hear about</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {NEWSLETTER_TOPICS.map((topic) => {
                  const on = topics.includes(topic.id);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(topic.id)}
                      className={`press border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                        on ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink hover:border-ink"
                      }`}
                    >
                      {topic.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex flex-col gap-3">
              <label htmlFor={`${id}-email`} className="font-mono text-[11px] uppercase tracking-wide text-muted">
                Email
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id={`${id}-email`}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  placeholder="you@example.com"
                  className="h-12 flex-1 border border-ink/15 bg-white px-3 text-base outline-none transition-colors hover:border-ink/40 focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink"
                />
                <button
                  type="submit"
                  className="press h-12 border border-ink bg-ink px-6 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink"
                >
                  Sign up
                </button>
              </div>
              {error ? (
                <p key={error} id={`${id}-error`} role="alert" className="rise text-sm text-ink">
                  {error}
                </p>
              ) : null}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
