"use client";

import { useEffect, useRef, useState } from "react";
import { deleteProfilePictureAction } from "@/app/dashboard/actions";
import { PhotoEditor } from "@/components/photo-editor";
import { ProfileAvatar } from "@/components/profile-avatar";
import { uploadProfilePicture } from "@/lib/photo-upload";
import type { PublicImage } from "@/lib/services/profiles";

/** The owner's independent portrait uploader. It does not use a project slot. */
export function ProfilePicture({ name, initialPicture }: { name: string; initialPicture: PublicImage | null }) {
  const [picture, setPicture] = useState(initialPicture);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ file: File; url: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef(false);
  useEffect(() => {
    if (!selected) return;
    return () => URL.revokeObjectURL(selected.url);
  }, [selected]);
  useEffect(() => {
    if (restoreFocus.current && !selected && busy === null) {
      restoreFocus.current = false;
      inputRef.current?.focus();
    }
  }, [selected, busy]);
  // The prepared picture from an upload that failed on the way, so "Try again" resends it without picking it again.
  const [unsent, setUnsent] = useState<Blob | null>(null);

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setUnsent(null);
    setSelected({ file, url: URL.createObjectURL(file) });
  }

  function cancelEdit() {
    restoreFocus.current = true;
    setSelected(null);
  }

  async function useEdit(photo: Blob) {
    restoreFocus.current = true;
    setSelected(null);
    await send(photo);
  }

  async function send(photo: Blob) {
    setError(null);
    setUnsent(null);
    setBusy(picture ? "Replacing picture…" : "Uploading picture…");
    const result = await uploadProfilePicture(photo);
    setBusy(null);
    if (result.ok) return setPicture(result.data.image);
    setError(result.error);
    if ("retryable" in result) setUnsent(photo);
  }

  async function remove() {
    setError(null);
    setUnsent(null);
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
              ref={inputRef}
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
            {busy ?? "JPEG, PNG, or WebP. Preview and crop to a square before uploading."}
          </p>
          {error ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p role="alert" className="rise text-sm text-red-700">
                Profile picture: {error}
              </p>
              {unsent ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => send(unsent)}
                  aria-label="Try again: upload the profile picture"
                  className="press min-h-11 border border-ink/15 px-3 font-mono text-[11px] uppercase tracking-wide outline-none hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
                >
                  Try again
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {selected ? <PhotoEditor file={selected.file} url={selected.url} aspect={1} onCancel={cancelEdit} onUse={useEdit} /> : null}
    </section>
  );
}
