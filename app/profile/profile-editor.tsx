"use client";

import { useMockStore } from "@/components/mock-store";
import {
  COURSES,
  getPublicProfile,
  type CourseId,
  type MockProfile,
} from "@/lib/mock-profiles";
import { contactEmail, githubUsername } from "@/lib/services/validation";
import { useEffect, useState } from "react";

type FormProject = {
  id: string;
  title: string;
  description: string;
  demoUrl: string;
  sourceUrl: string;
};

type FormState = {
  handle: string;
  displayName: string;
  tagline: string;
  courseId: CourseId;
  messengerUrl: string;
  githubUsername: string;
  contactEmail: string;
  projects: FormProject[];
};

function emptyProject(): FormProject {
  return {
    id: `project-${crypto.randomUUID()}`,
    title: "",
    description: "",
    demoUrl: "",
    sourceUrl: "",
  };
}

function toForm(profile: MockProfile): FormState {
  return {
    handle: profile.handle,
    displayName: profile.displayName,
    tagline: profile.tagline,
    courseId: profile.courseId,
    messengerUrl: profile.messengerUrl ?? "",
    githubUsername: profile.githubUsername ?? "",
    contactEmail: profile.contactEmail ?? "",
    projects: profile.projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      demoUrl: project.demoUrl ?? "",
      sourceUrl: project.sourceUrl ?? "",
    })),
  };
}

export function ProfileEditor() {
  const { ready, profiles, editableHandle, saveEditable } = useMockStore();
  const current = getPublicProfile(profiles, editableHandle);
  const [form, setForm] = useState<FormState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !current) return;
    // Fill the form once the mock store has loaded from the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(toForm(current));
  }, [ready, current]);

  if (!ready) {
    return (
      <section className="mx-auto w-full max-w-md px-4 py-16">
        <h1 className="text-3xl font-medium tracking-tight">Loading editor…</h1>
      </section>
    );
  }

  if (!current || !form) {
    return (
      <section className="mx-auto w-full max-w-md px-4 py-16">
        <h1 className="text-3xl font-medium tracking-tight">No sample student</h1>
      </section>
    );
  }

  const draft = form;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateProject(id: string, patch: Partial<FormProject>) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            projects: prev.projects.map((project) =>
              project.id === id ? { ...project, ...patch } : project,
            ),
          }
        : prev,
    );
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const handle = draft.handle.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,30}$/.test(handle)) {
      setError("Handle must be 2–30 letters, numbers, or hyphens.");
      return;
    }
    const taken = profiles.some(
      (profile) => profile.handle === handle && profile.handle !== editableHandle,
    );
    if (taken) {
      setError("That handle is already used in this mock.");
      return;
    }
    if (!draft.displayName.trim()) {
      setError("Name is required.");
      return;
    }

    // Same rules the server enforces, so the mock and the real form agree.
    const github = githubUsername.safeParse(draft.githubUsername);
    if (draft.githubUsername.trim() && !github.success) {
      setError(github.error.issues[0]?.message ?? "Check your GitHub username.");
      return;
    }
    const email = contactEmail.safeParse(draft.contactEmail);
    if (draft.contactEmail.trim() && !email.success) {
      setError(email.error.issues[0]?.message ?? "Check your contact email.");
      return;
    }

    const next: MockProfile = {
      handle,
      displayName: draft.displayName.trim(),
      tagline: draft.tagline.trim().slice(0, 100),
      courseId: draft.courseId,
      messengerUrl: draft.messengerUrl.trim() || null,
      githubUsername: github.success ? github.data : null,
      contactEmail: email.success ? email.data : null,
      projects: draft.projects
        .filter((project) => project.title.trim())
        .map((project) => ({
          id: project.id,
          title: project.title.trim(),
          description: project.description.trim(),
          demoUrl: project.demoUrl.trim() || null,
          sourceUrl: project.sourceUrl.trim() || null,
        })),
    };

    saveEditable(next);
    setForm(toForm(next));
    setNotice("Saved in this tab. Open Students to see the grid update.");
  }

  return (
    <section className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/profile</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">Your page</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Phone-first editor for {current.displayName}. Nothing is written to the
        database. Image upload is a placeholder.
      </p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-5">
        <Field id="handle" label="Handle">
          <input
            id="handle"
            name="handle"
            value={form.handle}
            onChange={(event) => update("handle", event.target.value)}
            className={inputClass}
            autoComplete="off"
          />
        </Field>
        <Field id="displayName" label="Name">
          <input
            id="displayName"
            name="displayName"
            value={form.displayName}
            onChange={(event) => update("displayName", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id="tagline" label="Tagline">
          <input
            id="tagline"
            name="tagline"
            maxLength={100}
            value={form.tagline}
            onChange={(event) => update("tagline", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id="courseId" label="Course">
          <select
            id="courseId"
            name="courseId"
            value={form.courseId}
            onChange={(event) => update("courseId", event.target.value as CourseId)}
            className={inputClass}
          >
            {COURSES.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="messengerUrl" label="Messenger link">
          <input
            id="messengerUrl"
            name="messengerUrl"
            type="url"
            placeholder="https://m.me/you"
            value={form.messengerUrl}
            onChange={(event) => update("messengerUrl", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id="githubUsername" label="GitHub" hint="Your username or profile link. Shown on your page.">
          <input
            id="githubUsername"
            name="githubUsername"
            aria-describedby="githubUsername-hint"
            placeholder="octocat"
            value={form.githubUsername}
            onChange={(event) => update("githubUsername", event.target.value)}
            className={inputClass}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <Field
          id="contactEmail"
          label="Contact email"
          hint="Anyone who opens your page can see this address. Leave it empty to keep it private."
        >
          <input
            id="contactEmail"
            name="contactEmail"
            aria-describedby="contactEmail-hint"
            type="email"
            placeholder="you@example.com"
            value={form.contactEmail}
            onChange={(event) => update("contactEmail", event.target.value)}
            className={inputClass}
            autoCapitalize="none"
            autoComplete="off"
          />
        </Field>

        <div className="border border-dashed border-ink/20 bg-paper px-4 py-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
            Image slot
          </p>
          <p className="mt-2 text-sm text-muted">Upload is not in this mock.</p>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-tight">Projects</h2>
            <button
              type="button"
              onClick={() => update("projects", [...form.projects, emptyProject()])}
              className="press font-mono text-[11px] uppercase tracking-wide outline-none hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
            >
              Add project
            </button>
          </div>
          {form.projects.map((project, index) => (
            <fieldset key={project.id} className="rise grid gap-3 border border-ink/10 p-4">
              <legend className="px-1 font-mono text-[11px] uppercase tracking-wide text-muted">
                Project {String(index + 1).padStart(2, "0")}
              </legend>
              <input
                aria-label={`Project ${index + 1} title`}
                placeholder="Title"
                value={project.title}
                onChange={(event) => updateProject(project.id, { title: event.target.value })}
                className={inputClass}
              />
              <textarea
                aria-label={`Project ${index + 1} description`}
                placeholder="One or two sentences"
                value={project.description}
                onChange={(event) =>
                  updateProject(project.id, { description: event.target.value })
                }
                className={`${inputClass} min-h-24`}
              />
              <input
                aria-label={`Project ${index + 1} demo link`}
                placeholder="Demo https://"
                value={project.demoUrl ?? ""}
                onChange={(event) => updateProject(project.id, { demoUrl: event.target.value })}
                className={inputClass}
              />
              <input
                aria-label={`Project ${index + 1} source link`}
                placeholder="Source https://"
                value={project.sourceUrl ?? ""}
                onChange={(event) =>
                  updateProject(project.id, { sourceUrl: event.target.value })
                }
                className={inputClass}
              />
              <button
                type="button"
                onClick={() =>
                  update(
                    "projects",
                    form.projects.filter((item) => item.id !== project.id),
                  )
                }
                className="press justify-self-start font-mono text-[11px] uppercase tracking-wide text-muted outline-none hover:text-red-700 focus-visible:ring-2 focus-visible:ring-ink"
              >
                Remove project
              </button>
            </fieldset>
          ))}
        </div>

        {/* Keyed so a repeated message rises in again instead of silently staying put. */}
        {error ? <p key={error} role="alert" className="rise text-sm text-red-700">{error}</p> : null}
        {notice ? <p key={notice} role="status" className="rise text-sm text-ink">{notice}</p> : null}

        <button
          type="submit"
          className="press h-12 border border-ink bg-ink font-mono text-[11px] uppercase tracking-wide text-white outline-none hover:border-ink/85 hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-ink"
        >
          Save in this tab
        </button>
      </form>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  // The hint describes the field; it must not become part of its name.
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="font-mono text-[11px] uppercase tracking-wide text-muted">
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

const inputClass =
  "w-full border border-ink/15 bg-white px-3 py-2 text-base outline-none transition-colors hover:border-ink/40 focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink";
