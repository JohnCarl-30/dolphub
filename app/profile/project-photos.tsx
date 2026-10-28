"use client";

import { useState } from "react";
import { deleteImageAction } from "@/app/dashboard/actions";
import { PhotoError, preparePhoto, uploadPhoto } from "@/lib/photo-upload";
import type { PublicImage } from "@/lib/services/profiles";

/** One project's photos. Unlike the text fields, adding or removing a photo saves straight away. */
export function ProjectPhotos({
  projectId,
  n,
  title,
  images,
  atLimit,
  onAdded,
  onRemoved,
  onStart,
}: {
  /** Null until the project is saved. */
  projectId: string | null;
  n: number;
  title: string;
  images: PublicImage[];
  atLimit: boolean;
  onAdded: (image: PublicImage) => void;
  onRemoved: (imageId: string) => void;
  /** Called when an upload or removal begins, so the editor can clear an older "Saved" notice. */
  onStart: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The prepared photo from an upload that failed on the way, so "Try again" resends it without picking it again.
  const [unsent, setUnsent] = useState<Blob | null>(null);
  const inputId = `project-${n}-photo`;

  if (!projectId) {
    return <p className="text-xs leading-5 text-muted">Save this project to add photos.</p>;
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear it, so choosing the same file again after an error still fires.
    event.target.value = "";
    if (!file || !projectId) return;
    onStart();
    let photo: Blob;
    try {
      photo = await preparePhoto(file);
    } catch (problem) {
      setUnsent(null);
      setError(problem instanceof PhotoError ? problem.message : "Couldn't read that photo. Try another one.");
      return;
    }
    await send(photo);
  }

  async function send(photo: Blob) {
    if (!projectId) return;
    onStart();
    setError(null);
    setUnsent(null);
    setBusy("Uploading photo…");
    const result = await uploadPhoto(projectId, photo);
    setBusy(null);
    if (result.ok) return onAdded(result.data.image);
    setError(result.error);
    if ("retryable" in result) setUnsent(photo);
  }

  async function remove(imageId: string) {
    onStart();
    setError(null);
    setUnsent(null);
    setBusy("Removing photo…");
    const result = await deleteImageAction(imageId);
    setBusy(null);
    if (result.ok) onRemoved(imageId);
    else setError(result.error);
  }

  return (
    <div className="grid gap-3">
      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <li key={image.id} className="grid gap-1">
              <div className="aspect-square overflow-hidden border border-ink/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  width={image.width}
                  height={image.height}
                  alt={`Photo ${index + 1} of ${title || `project ${n}`}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => remove(image.id)}
                aria-label={`Remove photo ${index + 1} from project ${n}`}
                className="press min-h-11 font-mono text-[11px] uppercase tracking-wide text-muted outline-none hover:text-red-700 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy !== null || atLimit}
          onChange={onFile}
          aria-label={`Add a photo to project ${n}`}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          className="press inline-flex min-h-11 cursor-pointer items-center border border-ink/15 px-3 font-mono text-[11px] uppercase tracking-wide outline-none hover:border-ink/40 peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
        >
          Add photo
        </label>
        {/* Live without role="status", so it never collides with the form's own message. */}
        <p aria-live="polite" className="text-xs leading-5 text-muted">
          {busy ?? (atLimit ? "You've used all your photos." : images.length === 0 ? "The first photo shows on your page." : "")}
        </p>
      </div>
      {error ? (
        <div className="flex flex-wrap items-center gap-3">
          <p key={error} role="alert" className="rise text-sm text-red-700">
            Photo: {error}
          </p>
          {unsent ? (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => send(unsent)}
              aria-label={`Try again: upload the photo for project ${n}`}
              className="press min-h-11 border border-ink/15 px-3 font-mono text-[11px] uppercase tracking-wide outline-none hover:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-60"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
