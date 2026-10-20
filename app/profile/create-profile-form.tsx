"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { checkHandleAction, createProfileAction } from "@/app/dashboard/actions";
import { Field, FormMessages, focusField, inputClass, submitClass } from "./fields";

type HandleStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "free"; handle: string }
  | { state: "problem"; message: string };

const FIELDS = ["handle", "displayName", "courseId", "tagline", "messengerUrl", "githubUsername", "contactEmail"] as const;
type FieldName = (typeof FIELDS)[number];

/** First visit to /profile: pick a permanent handle and the basics. */
export function CreateProfileForm({ courses }: { courses: { id: number; name: string }[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<FieldName, string>>(
    () => Object.fromEntries(FIELDS.map((f) => [f, ""])) as Record<FieldName, string>,
  );
  const [handleStatus, setHandleStatus] = useState<HandleStatus>({ state: "idle" });
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const handle = values.handle.trim().toLowerCase();
  useEffect(() => {
    if (!handle) return;
    let current = true;
    // Wait for a pause in typing before asking the server.
    const timer = setTimeout(async () => {
      setHandleStatus({ state: "checking" });
      const result = await checkHandleAction(handle);
      if (!current) return;
      if (!result.ok) setHandleStatus({ state: "problem", message: result.error });
      else if (result.data.available) setHandleStatus({ state: "free", handle });
      else setHandleStatus({ state: "problem", message: "That handle is already taken" });
    }, 400);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [handle]);

  function set(field: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (field === "handle" && !value.trim()) setHandleStatus({ state: "idle" });
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createProfileAction({ ...values, handle });
      if (!result.ok) {
        setError({ message: result.error, field: result.field });
        if (result.field) focusField(result.field);
        return;
      }
      // The page reloads its data and shows the editor for the new profile.
      router.refresh();
    });
  }

  const invalid = (field: FieldName) => error?.field === field || undefined;

  return (
    <section className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/profile</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">Create your page</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Your page is public at dolphub.tech/u/your-handle, and search engines can list it. You can turn that off after
        you create it.
      </p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-5" noValidate>
        <Field id="handle" label="Handle" hint="Letters, numbers and hyphens. It can't be changed later.">
          <input
            id="handle"
            name="handle"
            value={values.handle}
            onChange={(event) => set("handle", event.target.value)}
            aria-describedby="handle-hint handle-status"
            aria-invalid={invalid("handle") ?? (handleStatus.state === "problem" || undefined)}
            className={inputClass}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </Field>
        <p id="handle-status" aria-live="polite" className="-mt-3 min-h-5 font-mono text-[11px] uppercase tracking-wide">
          {!handle || handleStatus.state === "idle" ? null : handleStatus.state === "checking" ? (
            <span className="text-muted">Checking…</span>
          ) : handleStatus.state === "free" ? (
            <span className="text-ink">/u/{handleStatus.handle} is free</span>
          ) : (
            <span className="text-red-700">{handleStatus.message}</span>
          )}
        </p>
        <Field id="displayName" label="Name">
          <input
            id="displayName"
            name="displayName"
            value={values.displayName}
            onChange={(event) => set("displayName", event.target.value)}
            aria-invalid={invalid("displayName")}
            className={inputClass}
            autoComplete="name"
            required
          />
        </Field>
        <Field id="courseId" label="Course">
          <select
            id="courseId"
            name="courseId"
            value={values.courseId}
            onChange={(event) => set("courseId", event.target.value)}
            aria-invalid={invalid("courseId")}
            className={inputClass}
            required
          >
            <option value="">Choose your course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="tagline" label="Tagline" hint="Optional. One line about what you build, up to 100 characters.">
          <input
            id="tagline"
            name="tagline"
            maxLength={100}
            value={values.tagline}
            onChange={(event) => set("tagline", event.target.value)}
            aria-describedby="tagline-hint"
            aria-invalid={invalid("tagline")}
            className={inputClass}
          />
        </Field>
        <Field id="messengerUrl" label="Messenger link" hint="Optional. How visitors reach you.">
          <input
            id="messengerUrl"
            name="messengerUrl"
            type="url"
            placeholder="https://m.me/you"
            value={values.messengerUrl}
            onChange={(event) => set("messengerUrl", event.target.value)}
            aria-describedby="messengerUrl-hint"
            aria-invalid={invalid("messengerUrl")}
            className={inputClass}
            autoCapitalize="none"
          />
        </Field>
        <Field id="githubUsername" label="GitHub" hint="Optional. Your username or profile link.">
          <input
            id="githubUsername"
            name="githubUsername"
            placeholder="octocat"
            value={values.githubUsername}
            onChange={(event) => set("githubUsername", event.target.value)}
            aria-describedby="githubUsername-hint"
            aria-invalid={invalid("githubUsername")}
            className={inputClass}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          id="contactEmail"
          label="Contact email"
          hint="Optional. Anyone who opens your page can see this address."
        >
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            placeholder="you@example.com"
            value={values.contactEmail}
            onChange={(event) => set("contactEmail", event.target.value)}
            aria-describedby="contactEmail-hint"
            aria-invalid={invalid("contactEmail")}
            className={inputClass}
            autoCapitalize="none"
            autoComplete="off"
          />
        </Field>

        <FormMessages error={error?.message ?? null} notice={null} />

        <button type="submit" disabled={pending} className={submitClass}>
          {pending ? "Creating…" : "Create my page"}
        </button>
      </form>
    </section>
  );
}
