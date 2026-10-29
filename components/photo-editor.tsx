"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { PhotoError, renderEdit } from "@/lib/photo-upload";

type PhotoEditorProps = {
  file: File;
  url: string;
  aspect: number;
  onCancel: () => void;
  onUse: (photo: Blob) => void;
};

/** Edits one local file. The only upload-capable callback runs after rasterization succeeds. */
export function PhotoEditor({ file, url, aspect, onCancel, onUse }: PhotoEditorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function reset() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCropPixels(null);
    setError(null);
  }

  function rotate(degrees: number) {
    setCropPixels(null);
    setRotation((value) => (value + degrees + 360) % 360);
  }

  async function usePhoto() {
    if (!cropPixels || working) return;
    setWorking(true);
    setError(null);
    try {
      const photo = await renderEdit(file, { rotation, crop: cropPixels });
      onUse(photo);
    } catch (problem) {
      setError(problem instanceof PhotoError ? problem.message : "Couldn't edit that photo. Try another one.");
      setWorking(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="photo-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!working) onCancel();
      }}
      className="m-auto w-[min(96vw,42rem)] max-h-[95dvh] overflow-y-auto border border-ink/20 bg-white p-0 text-ink shadow-xl backdrop:bg-ink/70"
    >
      <div className="grid gap-4 p-4 sm:p-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">/photo</p>
          <h2 id="photo-editor-title" className="mt-1 text-2xl font-medium tracking-tight">Preview photo</h2>
          <p className="mt-1 text-sm text-muted">Drag to position. Pinch or use the slider to zoom.</p>
        </div>
        <div className="relative h-[min(48dvh,24rem)] min-h-48 overflow-hidden bg-paper touch-none" aria-label="Photo crop area">
          <Cropper
            image={url}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={(value) => { setCropPixels(null); setZoom(value); }}
            onCropAreaChange={(_area, pixels) => setCropPixels(pixels)}
            cropShape="rect"
            showGrid
            style={{ containerStyle: { touchAction: "none" } }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={working} onClick={() => rotate(-90)} aria-label="Rotate left 90 degrees" className="press min-h-11 border border-ink/15 px-3 font-mono text-[11px] uppercase tracking-wide disabled:opacity-50">Rotate left</button>
          <button type="button" disabled={working} onClick={() => rotate(90)} aria-label="Rotate right 90 degrees" className="press min-h-11 border border-ink/15 px-3 font-mono text-[11px] uppercase tracking-wide disabled:opacity-50">Rotate right</button>
          <button type="button" disabled={working} onClick={reset} className="press min-h-11 border border-ink/15 px-3 font-mono text-[11px] uppercase tracking-wide disabled:opacity-50">Reset</button>
        </div>
        <label className="grid gap-2 font-mono text-[11px] uppercase tracking-wide" htmlFor="photo-editor-zoom">
          Zoom
          <input id="photo-editor-zoom" type="range" min="1" max="3" step="0.01" value={zoom} disabled={working} onChange={(event) => { setCropPixels(null); setZoom(Number(event.target.value)); }} className="w-full accent-ink" />
        </label>
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-ink/10 pt-4">
          <button type="button" autoFocus disabled={working} onClick={onCancel} className="press min-h-11 border border-ink/15 px-4 font-mono text-[11px] uppercase tracking-wide disabled:opacity-50">Cancel</button>
          <button type="button" disabled={working || !cropPixels} onClick={usePhoto} className="press min-h-11 bg-ink px-4 font-mono text-[11px] uppercase tracking-wide text-white disabled:opacity-50">{working ? "Preparing…" : "Use photo"}</button>
        </div>
      </div>
    </dialog>
  );
}
