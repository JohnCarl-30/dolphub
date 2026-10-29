"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { updateProfileAction } from "@/app/dashboard/actions";
import {
  changedProfileFields,
  hasProfileChanges,
  profileFields,
  type ProfileFields,
} from "@/lib/profile-form";
import type { Dashboard } from "@/lib/services/dashboard";
import { Field, FormMessages, focusField, inputClass, submitClass } from "./fields";
import { ProfilePicture } from "./profile-picture";
import { ProfileTabs, useBeforeUnloadWarning } from "./profile-tabs";

type Profile = NonNullable<Dashboard["profile"]>;

/** Edits the signed-in student's public profile details. */
export function ProfileEditor({ dashboard }: { dashboard: Dashboard & { profile: Profile } }) {
  const { profile, courses } = dashboard;
  const [saved, setSaved] = useState(() => profileFields(profile));
  const [fields, setFields] = useState<ProfileFields>(saved);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const changes = changedProfileFields(saved, fields);
  const dirty = hasProfileChanges(changes);
  useBeforeUnloadWarning(dirty);

  function set<K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function fail(message: string, field?: string) {
    setError({ message, field });
    if (field) focusField(field);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      if (!hasProfileChanges(changes)) {
        setNotice("Nothing to save.");
        return;
      }
      const result = await updateProfileAction(changes);
      if (!result.ok) return fail(result.error, result.field);
      setSaved(fields);
      setNotice("Saved. Your public page shows the changes now.");
    });
  }

  const invalid = (id: string) => error?.field === id || undefined;

  return (
    <section className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/profile</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">Your page</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Changes show on your public page as soon as you save.</p>
      <ProfileTabs active="details" dirty={dirty} />
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
          <input id="displayName" name="displayName" value={fields.displayName}
            onChange={(event) => set("displayName", event.target.value)} aria-invalid={invalid("displayName")}
            className={inputClass} autoComplete="name" />
        </Field>
        <Field id="tagline" label="Tagline">
          <input id="tagline" name="tagline" maxLength={100} value={fields.tagline}
            onChange={(event) => set("tagline", event.target.value)} aria-invalid={invalid("tagline")}
            className={inputClass} />
        </Field>
        <Field id="courseId" label="Course">
          <select id="courseId" name="courseId" value={fields.courseId}
            onChange={(event) => set("courseId", event.target.value)} aria-invalid={invalid("courseId")}
            className={inputClass}>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
        </Field>
        <Field id="messengerUrl" label="Messenger link">
          <input id="messengerUrl" name="messengerUrl" type="url" placeholder="https://m.me/you"
            value={fields.messengerUrl} onChange={(event) => set("messengerUrl", event.target.value)}
            aria-invalid={invalid("messengerUrl")} className={inputClass} autoCapitalize="none" />
        </Field>
        <Field id="githubUsername" label="GitHub" hint="Your username or profile link. Shown on your page.">
          <input id="githubUsername" name="githubUsername" aria-describedby="githubUsername-hint"
            aria-invalid={invalid("githubUsername")} placeholder="octocat" value={fields.githubUsername}
            onChange={(event) => set("githubUsername", event.target.value)} className={inputClass}
            autoCapitalize="none" autoComplete="off" spellCheck={false} />
        </Field>
        <Field id="contactEmail" label="Contact email"
          hint="Anyone who opens your page can see this address. Leave it empty to keep it private.">
          <input id="contactEmail" name="contactEmail" aria-describedby="contactEmail-hint"
            aria-invalid={invalid("contactEmail")} type="email" placeholder="you@example.com"
            value={fields.contactEmail} onChange={(event) => set("contactEmail", event.target.value)}
            className={inputClass} autoCapitalize="none" autoComplete="off" />
        </Field>
        <div className="grid gap-2">
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="searchVisible" checked={fields.searchVisible}
              onChange={(event) => set("searchVisible", event.target.checked)} aria-describedby="searchVisible-hint"
              className="size-5 accent-ink outline-none focus-visible:ring-2 focus-visible:ring-ink" />
            Show my page in search engines
          </label>
          <p id="searchVisible-hint" className="text-xs leading-5 text-muted">
            Your page stays public either way. Turning this off asks Google and others not to list it.
          </p>
        </div>
        <FormMessages error={error?.message ?? null} notice={notice} />
        <button type="submit" disabled={pending} className={submitClass}>{pending ? "Saving…" : "Save changes"}</button>
      </form>
    </section>
  );
}
