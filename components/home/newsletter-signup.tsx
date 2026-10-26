"use client";

import { useId, useState, useTransition } from "react";
import { subscribeAction, unsubscribeAction } from "@/app/home/actions";
import type { NewsletterSubscription } from "@/lib/services/newsletter";
import type { OpportunityKind } from "@/lib/services/opportunities";
import { contactEmail } from "@/lib/services/validation";

const NEWSLETTER_TOPICS: { id: OpportunityKind; label: string }[] = [
  { id: "internship", label: "Internships" },
  { id: "event", label: "Events" },
  { id: "competition", label: "Competitions" },
  { id: "program", label: "Programs" },
];

/** Signs the student up for the weekly opportunities email. `initial` is their saved signup, if any. */
export function NewsletterSignup({ initial }: { initial: NewsletterSubscription | null }) {
  const id = useId();
  const [email, setEmail] = useState(initial?.email ?? "");
  const [topics, setTopics] = useState<OpportunityKind[]>(initial?.topics ?? ["internship", "event"]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<NewsletterSubscription | null>(initial);
  const [pending, startTransition] = useTransition();

  function toggle(topic: OpportunityKind) {
    setTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic],
    );
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    // Checked here first for an instant message; the server checks again.
    const parsed = contactEmail.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    if (topics.length === 0) {
      setError("Pick at least one kind of post to hear about.");
      return;
    }
    startTransition(async () => {
      const result = await subscribeAction({ email: parsed.data, topics });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setSaved(result.data);
    });
  }

  function unsubscribe() {
    startTransition(async () => {
      const result = await unsubscribeAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setSaved(null);
    });
  }

  return (
    <section aria-labelledby={`${id}-heading`} className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <p className="viewport-reveal font-mono text-[11px] uppercase tracking-wide text-muted">/newsletter</p>
      <div className="mt-3 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="viewport-reveal">
          <h2 id={`${id}-heading`} className="text-3xl font-medium tracking-tight">
            Get new posts by email
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            One short email on Mondays with the internships and events posted that week. Change
            your topics or stop at any time.
          </p>
        </div>

        {saved ? (
          <div role="status" className="rise self-start border border-ink/10 bg-white p-4">
            <p className="font-medium">You are on the list</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              We will email {saved.email} about{" "}
              {NEWSLETTER_TOPICS.filter((topic) => saved.topics.includes(topic.id))
                .map((topic) => topic.label.toLowerCase())
                .join(", ")}
              .
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => setSaved(null)}
                disabled={pending}
                className="text-sm underline underline-offset-4 outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
              >
                Change email or topics
              </button>
              <button
                type="button"
                onClick={unsubscribe}
                disabled={pending}
                className="text-sm underline underline-offset-4 outline-none transition-colors hover:text-muted focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
              >
                Unsubscribe
              </button>
            </div>
            {error ? (
              <p role="alert" className="rise mt-2 text-sm text-ink">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="viewport-reveal flex flex-col gap-5">
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
                  disabled={pending}
                  className="press h-12 disabled:opacity-60 border border-ink bg-ink px-6 font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink"
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
