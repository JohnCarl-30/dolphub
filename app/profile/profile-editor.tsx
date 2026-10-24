"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  createProjectAction,
  deleteProjectAction,
  updateProfileAction,
  updateProjectAction,
} from "@/app/dashboard/actions";
import {
  changedProfileFields,
  hasChanges,
  planProjectSaves,
  profileFields,
  projectFields,
  type ProfileFields,
  type ProjectFields,
} from "@/lib/profile-form";
import type { Dashboard } from "@/lib/services/dashboard";
import type { PublicImage } from "@/lib/services/profiles";
import { Field, FormMessages, focusField, inputClass, submitClass } from "./fields";
import { ProfilePicture } from "./profile-picture";
import { ProjectPhotos } from "./project-photos";

type Profile = NonNullable<Dashboard["profile"]>;
type ProjectText = "title" | "description" | "demoUrl" | "sourceUrl";

function emptyProject(): ProjectFields {
  return { key: `new-${crypto.randomUUID()}`, id: null, title: "", description: "", demoUrl: "", sourceUrl: "" };
}

function projectInputId(key: string, field: string) {
  return `project-${key}-${field}`;
}

/** Edits the signed-in student's own page. Every save goes to the database and refreshes the public page. */
export function ProfileEditor({ dashboard }: { dashboard: Dashboard & { profile: Profile } }) {
  const { profile, courses, imageLimit } = dashboard;
  // What the server has, updated step by step as saves succeed, so a retry after an error never repeats a step.
  const [saved, setSaved] = useState(() => ({
    fields: profileFields(profile),
    projects: projectFields(dashboard.projects),
  }));
  const [fields, setFields] = useState<ProfileFields>(saved.fields);
  const [projects, setProjects] = useState<ProjectFields[]>(saved.projects);
  // Photos save on their own, as soon as they're added or removed. Keyed by project id.
  const [photos, setPhotos] = useState<Record<string, PublicImage[]>>(() =>
    Object.fromEntries(dashboard.projects.map((p) => [p.id, p.images])),
  );
  const photoCount = Object.values(photos).reduce((sum, list) => sum + list.length, 0);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function setProject(key: string, field: ProjectText, value: string) {
    setProjects((prev) => prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)));
  }

  function fail(message: string, field?: string) {
    setError({ message, field });
    if (field) focusField(field);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const draft = { fields, projects };

    startTransition(async () => {
      const changes = changedProfileFields(saved.fields, draft.fields);
      const plan = planProjectSaves(saved.projects, draft.projects);
      if (!hasChanges(changes, plan)) {
        setNotice("Nothing to save.");
        return;
      }

      if (Object.keys(changes).length > 0) {
        const result = await updateProfileAction(changes);
        if (!result.ok) return fail(result.error, result.field);
        setSaved((prev) => ({ ...prev, fields: draft.fields }));
      }

      const label = (key: string) => {
        const index = draft.projects.findIndex((p) => p.key === key);
        return `Project ${String(index + 1).padStart(2, "0")}`;
      };

      for (const id of plan.remove) {
        const result = await deleteProjectAction(id);
        if (!result.ok) return fail(result.error);
        setSaved((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
        // The server deleted the project's photos with it.
        setPhotos((prev) => Object.fromEntries(Object.entries(prev).filter(([projectId]) => projectId !== id)));
      }
      for (const { key, id, input } of plan.update) {
        const result = await updateProjectAction(id, input);
        if (!result.ok) {
          return fail(`${label(key)}: ${result.error}`, result.field ? projectInputId(key, result.field) : undefined);
        }
        const current = draft.projects.find((p) => p.key === key)!;
        setSaved((prev) => ({ ...prev, projects: prev.projects.map((p) => (p.id === id ? current : p)) }));
      }
      for (const { key, input } of plan.create) {
        const result = await createProjectAction(input);
        if (!result.ok) {
          return fail(`${label(key)}: ${result.error}`, result.field ? projectInputId(key, result.field) : undefined);
        }
        const created = { ...draft.projects.find((p) => p.key === key)!, id: result.data.projectId };
        // Keep the key, so the inputs stay mounted and focus doesn't jump.
        setProjects((prev) => prev.map((p) => (p.key === key ? { ...p, id: created.id } : p)));
        setSaved((prev) => ({ ...prev, projects: [...prev.projects, created] }));
      }

      setNotice("Saved. Your public page shows the changes now.");
    });
  }

  const invalid = (id: string) => error?.field === id || undefined;

  return (
    <section className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/profile</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">Your page</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Changes show on your public page as soon as you save.
      </p>
      <Link
        href={`/u/${profile.handle}`}
        className="mt-4 inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-wide underline underline-offset-4 outline-none hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
      >
        View /u/{profile.handle} →
      </Link>

      <ProfilePicture name={profile.displayName} initialPicture={profile.profilePicture} />

      {profile.isHidden ? (
        <div role="note" className="mt-6 border border-red-700/40 bg-white px-4 py-3 text-sm leading-6">
          <p className="font-medium text-red-700">An admin took your page down.</p>
          {profile.hiddenReason ? <p className="mt-1 text-muted">Reason: {profile.hiddenReason}</p> : null}
          <p className="mt-1 text-muted">Visitors can&apos;t see it. Your edits still save.</p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 grid gap-5" noValidate>
        <div className="grid gap-2">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Handle</p>
          <p className="text-base">/u/{profile.handle}</p>
          <p className="text-xs leading-5 text-muted">Handles never change, so links you shared keep working.</p>
        </div>
        <Field id="displayName" label="Name">
          <input
            id="displayName"
            name="displayName"
            value={fields.displayName}
            onChange={(event) => set("displayName", event.target.value)}
            aria-invalid={invalid("displayName")}
            className={inputClass}
            autoComplete="name"
          />
        </Field>
        <Field id="tagline" label="Tagline">
          <input
            id="tagline"
            name="tagline"
            maxLength={100}
            value={fields.tagline}
            onChange={(event) => set("tagline", event.target.value)}
            aria-invalid={invalid("tagline")}
            className={inputClass}
          />
        </Field>
        <Field id="courseId" label="Course">
          <select
            id="courseId"
            name="courseId"
            value={fields.courseId}
            onChange={(event) => set("courseId", event.target.value)}
            aria-invalid={invalid("courseId")}
            className={inputClass}
          >
            {courses.map((course) => (
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
            value={fields.messengerUrl}
            onChange={(event) => set("messengerUrl", event.target.value)}
            aria-invalid={invalid("messengerUrl")}
            className={inputClass}
            autoCapitalize="none"
          />
        </Field>
        <Field id="githubUsername" label="GitHub" hint="Your username or profile link. Shown on your page.">
          <input
            id="githubUsername"
            name="githubUsername"
            aria-describedby="githubUsername-hint"
            aria-invalid={invalid("githubUsername")}
            placeholder="octocat"
            value={fields.githubUsername}
            onChange={(event) => set("githubUsername", event.target.value)}
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
            aria-invalid={invalid("contactEmail")}
            type="email"
            placeholder="you@example.com"
            value={fields.contactEmail}
            onChange={(event) => set("contactEmail", event.target.value)}
            className={inputClass}
            autoCapitalize="none"
            autoComplete="off"
          />
        </Field>
        <div className="grid gap-2">
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="searchVisible"
              checked={fields.searchVisible}
              onChange={(event) => set("searchVisible", event.target.checked)}
              aria-describedby="searchVisible-hint"
              className="size-5 accent-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
            />
            Show my page in search engines
          </label>
          <p id="searchVisible-hint" className="text-xs leading-5 text-muted">
            Your page stays public either way. Turning this off asks Google and others not to list it.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-tight">Projects</h2>
            <button
              type="button"
              onClick={() => setProjects((prev) => [...prev, emptyProject()])}
              className="press min-h-11 font-mono text-[11px] uppercase tracking-wide outline-none hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
            >
              Add project
            </button>
          </div>
          <p className="text-xs leading-5 text-muted">
            Photos: {photoCount} of {imageLimit} used, across all projects. Photos save as soon as you add or
            remove them.
          </p>
          {projects.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              Add a project to appear in the home page showcase.
            </p>
          ) : null}
          {projects.map((project, index) => {
            const n = index + 1;
            const id = (field: string) => projectInputId(project.key, field);
            return (
              <fieldset key={project.key} className="rise grid gap-3 border border-ink/10 p-4">
                <legend className="px-1 font-mono text-[11px] uppercase tracking-wide text-muted">
                  Project {String(n).padStart(2, "0")}
                </legend>
                <input
                  id={id("title")}
                  aria-label={`Project ${n} title`}
                  aria-invalid={invalid(id("title"))}
                  placeholder="Title"
                  value={project.title}
                  onChange={(event) => setProject(project.key, "title", event.target.value)}
                  className={inputClass}
                />
                <textarea
                  id={id("description")}
                  aria-label={`Project ${n} description`}
                  aria-invalid={invalid(id("description"))}
                  placeholder="One or two sentences"
                  value={project.description}
                  onChange={(event) => setProject(project.key, "description", event.target.value)}
                  className={`${inputClass} min-h-24`}
                />
                <input
                  id={id("demoUrl")}
                  aria-label={`Project ${n} demo link`}
                  aria-invalid={invalid(id("demoUrl"))}
                  placeholder="Demo https://"
                  value={project.demoUrl}
                  onChange={(event) => setProject(project.key, "demoUrl", event.target.value)}
                  className={inputClass}
                  autoCapitalize="none"
                />
                <input
                  id={id("sourceUrl")}
                  aria-label={`Project ${n} source link`}
                  aria-invalid={invalid(id("sourceUrl"))}
                  placeholder="Source https://"
                  value={project.sourceUrl}
                  onChange={(event) => setProject(project.key, "sourceUrl", event.target.value)}
                  className={inputClass}
                  autoCapitalize="none"
                />
                <ProjectPhotos
                  projectId={project.id}
                  n={n}
                  title={project.title}
                  images={(project.id && photos[project.id]) || []}
                  atLimit={photoCount >= imageLimit}
                  onStart={() => setNotice(null)}
                  onAdded={(image) =>
                    setPhotos((prev) => ({ ...prev, [project.id!]: [...(prev[project.id!] ?? []), image] }))
                  }
                  onRemoved={(imageId) =>
                    setPhotos((prev) => ({
                      ...prev,
                      [project.id!]: (prev[project.id!] ?? []).filter((image) => image.id !== imageId),
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={() => setProjects((prev) => prev.filter((p) => p.key !== project.key))}
                  className="press min-h-11 justify-self-start font-mono text-[11px] uppercase tracking-wide text-muted outline-none hover:text-red-700 focus-visible:ring-2 focus-visible:ring-ink"
                >
                  Remove project {n}
                </button>
              </fieldset>
            );
          })}
        </div>

        <FormMessages error={error?.message ?? null} notice={notice} />

        <button type="submit" disabled={pending} className={submitClass}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </section>
  );
}
