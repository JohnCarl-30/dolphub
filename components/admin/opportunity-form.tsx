"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createOpportunityAction, updateOpportunityAction } from "@/app/admin/opportunities/actions";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { KIND_NAMES, PLACE_LABELS } from "@/lib/opportunity-display";
import { closesAtFor, parseManilaDateTime } from "@/lib/opportunity-time";
import type { LocationType, OpportunityKind, PublicOpportunity } from "@/lib/services/opportunities";
import { changedFields, toActionInput, type OpportunityFormValues } from "@/lib/opportunity-form";
import { inputClass, labelClass, primaryButton, secondaryButton } from "./styles";

const KINDS = Object.keys(KIND_NAMES) as OpportunityKind[];
const PLACES = Object.keys(PLACE_LABELS) as LocationType[];

/** Which dates each kind needs, matching the rules in lib/services/opportunities.ts. */
const DATE_RULES: Record<OpportunityKind, string> = {
  internship: "Needs the last day to apply.",
  program: "Needs the last day to apply.",
  event: "Needs a start time. It closes at its end time, or at the end of the day it starts.",
  competition: "Needs a registration deadline, a start time, or both.",
};

/** The action's field names, mapped to the input that should take focus. */
const FIELD_INPUT: Record<string, string> = {
  kind: "post-kind",
  title: "post-title",
  organization: "post-organization",
  summary: "post-summary",
  url: "post-url",
  locationType: "post-place-type",
  location: "post-location",
  deadline: "post-deadline-date",
  startsAt: "post-starts",
  endsAt: "post-ends",
};

type Props =
  | { mode: "create"; initial: OpportunityFormValues }
  | { mode: "edit"; id: string; initial: OpportunityFormValues };

/** Posting and editing a post, with every date in Philippine time and a live preview of the card. */
export function OpportunityForm(props: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(props.initial);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof OpportunityFormValues>(key: K, value: OpportunityFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    let edits: ReturnType<typeof changedFields> | null = null;
    if (props.mode === "edit") {
      edits = changedFields(props.initial, values);
      if (Object.keys(edits).length === 0) {
        setError(null);
        setNotice("Nothing has changed yet.");
        return;
      }
    }
    startTransition(async () => {
      const result =
        props.mode === "create"
          ? await createOpportunityAction(toActionInput(values))
          : await updateOpportunityAction(props.id, edits!);
      if (!result.ok) {
        setError({ message: result.error, field: result.field });
        const inputId = result.field ? FIELD_INPUT[result.field] : undefined;
        if (inputId) formRef.current?.querySelector<HTMLElement>(`#${inputId}`)?.focus();
        return;
      }
      router.push(`/admin/opportunities?saved=${encodeURIComponent(result.data.slug)}`);
    });
  }

  /** Error wiring for one input: marks it invalid and points it at the message. */
  function errorFor(field: string, hintId?: string) {
    const invalid = error?.field === field;
    const describedBy = [hintId, invalid ? "post-error" : null].filter(Boolean).join(" ");
    return { "aria-invalid": invalid || undefined, "aria-describedby": describedBy || undefined };
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-8">
      <fieldset className="grid gap-5">
        <legend className="mb-4 text-xl font-medium tracking-tight">The post</legend>
        <Field id="post-kind" label="Kind">
          <select
            id="post-kind"
            value={values.kind}
            onChange={(event) => set("kind", event.target.value as OpportunityKind)}
            className={inputClass}
            {...errorFor("kind")}
          >
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_NAMES[kind]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="post-title" label="Title" hint="Up to 120 characters, for example “Software engineering intern”.">
          <input
            id="post-title"
            value={values.title}
            onChange={(event) => set("title", event.target.value)}
            required
            maxLength={120}
            className={inputClass}
            {...errorFor("title", "post-title-hint")}
          />
        </Field>
        <Field id="post-organization" label="Organization">
          <input
            id="post-organization"
            value={values.organization}
            onChange={(event) => set("organization", event.target.value)}
            required
            maxLength={80}
            className={inputClass}
            {...errorFor("organization")}
          />
        </Field>
        <Field id="post-summary" label="Summary" hint={`Who it is for and what it involves. ${values.summary.length} of 500 characters.`}>
          <textarea
            id="post-summary"
            value={values.summary}
            onChange={(event) => set("summary", event.target.value)}
            required
            maxLength={500}
            rows={4}
            className={`${inputClass} min-h-28`}
            {...errorFor("summary", "post-summary-hint")}
          />
        </Field>
        <Field id="post-url" label="Link to apply or register" hint="The organization's own page. It must start with https://.">
          <input
            id="post-url"
            type="url"
            inputMode="url"
            value={values.url}
            onChange={(event) => set("url", event.target.value)}
            required
            placeholder="https://"
            className={inputClass}
            {...errorFor("url", "post-url-hint")}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5">
        <legend className="mb-4 text-xl font-medium tracking-tight">Where</legend>
        <Field id="post-place-type" label="Format">
          <select
            id="post-place-type"
            value={values.locationType}
            onChange={(event) => set("locationType", event.target.value as LocationType)}
            className={inputClass}
            {...errorFor("locationType")}
          >
            {PLACES.map((place) => (
              <option key={place} value={place}>
                {PLACE_LABELS[place]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="post-location" label="Place, optional" hint="For example “Makati” or “PCU Manila, Room 402”.">
          <input
            id="post-location"
            value={values.location}
            onChange={(event) => set("location", event.target.value)}
            maxLength={120}
            className={inputClass}
            {...errorFor("location", "post-location-hint")}
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5" aria-describedby="post-dates-hint">
        <legend className="mb-4 text-xl font-medium tracking-tight">When</legend>
        <p id="post-dates-hint" className="text-sm leading-6 text-muted">
          All times are Philippine time. {DATE_RULES[values.kind]}
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="post-deadline-date" label="Deadline">
            <input
              id="post-deadline-date"
              type="date"
              value={values.deadlineDate}
              onChange={(event) => set("deadlineDate", event.target.value)}
              className={inputClass}
              {...errorFor("deadline")}
            />
          </Field>
          <Field id="post-deadline-time" label="Deadline time, optional" hint="Leave empty for 11:59 PM.">
            <input
              id="post-deadline-time"
              type="time"
              value={values.deadlineTime}
              onChange={(event) => set("deadlineTime", event.target.value)}
              disabled={!values.deadlineDate}
              className={`${inputClass} disabled:opacity-60`}
              aria-describedby="post-deadline-time-hint"
            />
          </Field>
          <Field id="post-starts" label="Starts">
            <input
              id="post-starts"
              type="datetime-local"
              value={values.startsAt}
              onChange={(event) => set("startsAt", event.target.value)}
              className={inputClass}
              {...errorFor("startsAt")}
            />
          </Field>
          <Field id="post-ends" label="Ends, optional">
            <input
              id="post-ends"
              type="datetime-local"
              value={values.endsAt}
              onChange={(event) => set("endsAt", event.target.value)}
              disabled={!values.startsAt && !values.endsAt}
              className={`${inputClass} disabled:opacity-60`}
              {...errorFor("endsAt")}
            />
          </Field>
        </div>
      </fieldset>

      <Preview values={values} />

      <div className="grid gap-3">
        {error ? (
          <p id="post-error" key={error.message} role="alert" className="rise text-sm text-red-700">
            {error.message}
          </p>
        ) : null}
        {notice ? (
          <p key={notice} role="status" className="rise text-sm text-ink">
            {notice}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "Saving…" : props.mode === "create" ? "Post it" : "Save changes"}
          </button>
          <button type="button" onClick={() => router.push("/admin/opportunities")} className={secondaryButton}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  // The hint describes the field; it must not become part of its name.
  return (
    <div className="grid content-start gap-2">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs leading-5 text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** The card as students will see it in the list. Updates as the admin types. */
function Preview({ values }: { values: OpportunityFormValues }) {
  const input = toActionInput(values);
  const date = (value: string) => parseManilaDateTime(value) ?? null;
  const deadline = date(input.deadline as string);
  const startsAt = date(input.startsAt as string);
  const endsAt = date(input.endsAt as string);
  const closesAt = closesAtFor({ deadline, startsAt, endsAt });
  const now = new Date();

  const post: PublicOpportunity | null = closesAt
    ? {
        slug: "preview",
        kind: values.kind,
        title: values.title.trim() || "Title",
        organization: values.organization.trim() || "Organization",
        summary: values.summary,
        url: values.url,
        locationType: values.locationType,
        location: values.location.trim() || null,
        startsAt,
        endsAt,
        deadline,
        closesAt,
        createdAt: now,
        updatedAt: now,
      }
    : null;

  return (
    <section aria-labelledby="preview-heading" className="grid gap-3">
      <h2 id="preview-heading" className="text-xl font-medium tracking-tight">
        Preview
      </h2>
      {post ? (
        <>
          {/* inert: a look, not a link. The real card opens the post's page. */}
          <div inert className="max-w-sm">
            <OpportunityCard post={post} now={now} />
          </div>
          {closesAt && closesAt.getTime() <= now.getTime() ? (
            <p className="text-sm leading-6 text-red-700">These dates have already passed, so the post would be closed.</p>
          ) : null}
        </>
      ) : (
        <p className="max-w-sm border border-dashed border-ink/20 px-4 py-5 text-sm leading-6 text-muted">
          Add a date to see the card and when the post closes.
        </p>
      )}
    </section>
  );
}
