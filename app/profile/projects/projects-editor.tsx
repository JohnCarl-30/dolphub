"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from "@/app/dashboard/actions";
import {
  hasProjectChanges,
  planProjectSaves,
  projectFields,
  type ProjectFields,
} from "@/lib/profile-form";
import type { Dashboard } from "@/lib/services/dashboard";
import type { PublicImage } from "@/lib/services/profiles";
import { FormMessages, focusField, inputClass, submitClass } from "../fields";
import { ProjectPhotos } from "../project-photos";
import { ProfileTabs, useBeforeUnloadWarning } from "../profile-tabs";

type Profile = NonNullable<Dashboard["profile"]>;
type ProjectText = "title" | "description" | "demoUrl" | "sourceUrl";

function emptyProject(): ProjectFields {
  return { key: `new-${crypto.randomUUID()}`, id: null, title: "", description: "", demoUrl: "", sourceUrl: "" };
}

function projectInputId(key: string, field: string) {
  return `project-${key}-${field}`;
}

/** Edits all projects and project photos owned by the signed-in student. */
export function ProjectsEditor({ dashboard }: { dashboard: Dashboard & { profile: Profile } }) {
  const { profile, imageLimit } = dashboard;
  const [saved, setSaved] = useState<ProjectFields[]>(() => projectFields(dashboard.projects));
  const [projects, setProjects] = useState<ProjectFields[]>(saved);
  const [photos, setPhotos] = useState<Record<string, PublicImage[]>>(() =>
    Object.fromEntries(dashboard.projects.map((project) => [project.id, project.images])),
  );
  const photoCount = Object.values(photos).reduce((sum, list) => sum + list.length, 0);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const plan = planProjectSaves(saved, projects);
  const dirty = hasProjectChanges(plan);
  useBeforeUnloadWarning(dirty);

  function setProject(key: string, field: ProjectText, value: string) {
    setProjects((prev) => prev.map((project) => (project.key === key ? { ...project, [field]: value } : project)));
  }

  function fail(message: string, field?: string) {
    setError({ message, field });
    if (field) focusField(field);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const draft = projects;
    startTransition(async () => {
      const savePlan = planProjectSaves(saved, draft);
      if (!hasProjectChanges(savePlan)) {
        setNotice("Nothing to save.");
        return;
      }

      const label = (key: string) => {
        const index = draft.findIndex((project) => project.key === key);
        return `Project ${String(index + 1).padStart(2, "0")}`;
      };

      for (const id of savePlan.remove) {
        const result = await deleteProjectAction(id);
        if (!result.ok) return fail(result.error);
        setSaved((prev) => prev.filter((project) => project.id !== id));
        setPhotos((prev) => Object.fromEntries(Object.entries(prev).filter(([projectId]) => projectId !== id)));
      }
      for (const { key, id, input } of savePlan.update) {
        const result = await updateProjectAction(id, input);
        if (!result.ok) {
          return fail(`${label(key)}: ${result.error}`, result.field ? projectInputId(key, result.field) : undefined);
        }
        const current = draft.find((project) => project.key === key)!;
        setSaved((prev) => prev.map((project) => (project.id === id ? current : project)));
      }
      for (const { key, input } of savePlan.create) {
        const result = await createProjectAction(input);
        if (!result.ok) {
          return fail(`${label(key)}: ${result.error}`, result.field ? projectInputId(key, result.field) : undefined);
        }
        const created = { ...draft.find((project) => project.key === key)!, id: result.data.projectId };
        setProjects((prev) => prev.map((project) => (project.key === key ? { ...project, id: created.id } : project)));
        setSaved((prev) => [...prev, created]);
      }

      setNotice("Saved. Your public page shows the changes now.");
    });
  }

  const invalid = (id: string) => error?.field === id || undefined;

  return (
    <section className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/profile/projects</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">Your projects</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Projects and photos show on your public page as soon as you save or upload.</p>
      <ProfileTabs active="projects" dirty={dirty} />
      <Link
        href={`/u/${profile.handle}`}
        className="mt-4 inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-wide underline underline-offset-4 outline-none hover:text-muted focus-visible:ring-2 focus-visible:ring-ink"
      >
        View /u/{profile.handle} →
      </Link>

      <form onSubmit={onSubmit} className="mt-8 grid gap-5" noValidate>
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
          Photos: {photoCount} of {imageLimit} used, across all projects. Preview and confirm a photo before it uploads.
        </p>
        {projects.length === 0 ? (
          <p className="text-sm leading-6 text-muted">Add a project to appear in the home showcase.</p>
        ) : null}
        {projects.map((project, index) => {
          const n = index + 1;
          const id = (field: string) => projectInputId(project.key, field);
          return (
            <fieldset key={project.key} className="rise grid gap-3 border border-ink/10 p-4">
              <legend className="px-1 font-mono text-[11px] uppercase tracking-wide text-muted">
                Project {String(n).padStart(2, "0")}
              </legend>
              <input id={id("title")} aria-label={`Project ${n} title`} aria-invalid={invalid(id("title"))}
                placeholder="Title" value={project.title} onChange={(event) => setProject(project.key, "title", event.target.value)}
                className={inputClass} />
              <textarea id={id("description")} aria-label={`Project ${n} description`} aria-invalid={invalid(id("description"))}
                placeholder="One or two sentences" value={project.description}
                onChange={(event) => setProject(project.key, "description", event.target.value)}
                className={`${inputClass} min-h-24`} />
              <input id={id("demoUrl")} aria-label={`Project ${n} demo link`} aria-invalid={invalid(id("demoUrl"))}
                placeholder="Demo https://" value={project.demoUrl}
                onChange={(event) => setProject(project.key, "demoUrl", event.target.value)} className={inputClass}
                autoCapitalize="none" />
              <input id={id("sourceUrl")} aria-label={`Project ${n} source link`} aria-invalid={invalid(id("sourceUrl"))}
                placeholder="Source https://" value={project.sourceUrl}
                onChange={(event) => setProject(project.key, "sourceUrl", event.target.value)} className={inputClass}
                autoCapitalize="none" />
              <ProjectPhotos
                projectId={project.id}
                n={n}
                title={project.title}
                images={(project.id && photos[project.id]) || []}
                atLimit={photoCount >= imageLimit}
                onStart={() => setNotice(null)}
                onAdded={(image) => setPhotos((prev) => ({ ...prev, [project.id!]: [...(prev[project.id!] ?? []), image] }))}
                onRemoved={(imageId) => setPhotos((prev) => ({
                  ...prev,
                  [project.id!]: (prev[project.id!] ?? []).filter((image) => image.id !== imageId),
                }))}
              />
              <button type="button" onClick={() => setProjects((prev) => prev.filter((item) => item.key !== project.key))}
                className="press min-h-11 justify-self-start font-mono text-[11px] uppercase tracking-wide text-muted outline-none hover:text-red-700 focus-visible:ring-2 focus-visible:ring-ink">
                Remove project {n}
              </button>
            </fieldset>
          );
        })}

        <FormMessages error={error?.message ?? null} notice={notice} />
        <button type="submit" disabled={pending} className={submitClass}>{pending ? "Saving…" : "Save changes"}</button>
      </form>
    </section>
  );
}
