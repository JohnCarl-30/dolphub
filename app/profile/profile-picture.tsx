"use client";

import { useState } from "react";
import { deleteProfilePictureAction } from "@/app/dashboard/actions";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PhotoError, preparePhoto, uploadProfilePicture } from "@/lib/photo-upload";
import type { PublicImage } from "@/lib/services/profiles";

/** The owner's independent portrait uploader. It does not use a project slot. */
export function ProfilePicture({ name, initialPicture }: { name: string; initialPicture: PublicImage | null }) {
  const [picture, setPicture] = useState(initialPicture);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(picture ? "Replacing picture…" : "Uploading picture…");
    try {
      const result = await uploadProfilePicture(await preparePhoto(file));
      if (result.ok) setPicture(result.data.image);
      else setError(result.error);
    } catch (problem) {
      setError(problem instanceof PhotoError ? problem.message : "Couldn't read that picture. Try another one.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setError(null);
    setBusy("Removing picture…");
    const result = await deleteProfilePictureAction();
    setBusy(null);
    if (result.ok) setPicture(null);
    else setError(result.error);
  }

  return (
    <section aria-labelledby="profile-picture-heading" className="mt-8 border border-ink/10 p-4">
      <div className="flex items-start gap-4">
        <ProfileAvatar name={name} src={picture?.url} className="size-20 shrink-0" />
        <div className="min-w-0">
          <h2 id="profile-picture-heading" className="text-xl font-medium tracking-tight">
            Profile picture
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            Shown on your public page, dashboard, and account menu. It does not count toward your project photos.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              id="profile-picture"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy !== null}
              onChange={onFile}
              aria-label="Upload profile picture"
              className="peer sr-only"
            />
            <label
              htmlFor="profile-picture"
              className="press inline-flex min-h-11 cursor-pointer items-center border border-ink/15 px-3 font-mono text-[11px] uppercase tracking-wide outline-none hover:border-ink/40 peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
            >
              {picture ? "Replace picture" : "Upload picture"}
            </label>
            {picture ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={remove}
                className="press min-h-11 font-mono text-[11px] uppercase tracking-wide text-muted outline-none hover:text-red-700 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
              >
                Remove picture
              </button>
            ) : null}
          </div>
          <p aria-live="polite" className="mt-3 text-xs leading-5 text-muted">
            {busy ?? "JPEG, PNG, or WebP. Your picture is centered and square on the page."}
          </p>
          {error ? (
            <p role="alert" className="rise mt-3 text-sm text-red-700">
              Profile picture: {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
