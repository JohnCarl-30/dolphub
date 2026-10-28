import type { UploadResult } from "./upload-route";

/**
 * Browser side of photo uploads. Phone photos are often over the 4 MB
 * upload cap, and Vercel rejects request bodies over 4.5 MB, so large or
 * unusual files are shrunk to a JPEG before they leave the phone.
 * The server re-encodes everything again, so this only has to get under the cap.
 */

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Below the server's 4 MB cap, with room for the form around the file. */
export const SEND_AS_IS_BYTES = 3.5 * 1024 * 1024;

/** The server stores at most 1600 px, so anything larger is wasted upload time. */
const MAX_SIDE = 2400;
const ATTEMPTS = [
  { side: MAX_SIDE, quality: 0.85 },
  { side: MAX_SIDE, quality: 0.7 },
  { side: 1600, quality: 0.7 },
  { side: 1200, quality: 0.6 },
];

export function needsCompression(file: { size: number; type: string }): boolean {
  return !ACCEPTED_PHOTO_TYPES.includes(file.type) || file.size > SEND_AS_IS_BYTES;
}

/** Scales a size down so its longer side is at most `max`, keeping the shape. Never scales up. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export class PhotoError extends Error {}

/** The file to send: the original when it already fits, otherwise a smaller JPEG. */
export async function preparePhoto(file: File): Promise<Blob> {
  if (!needsCompression(file)) return file;

  let bitmap: ImageBitmap;
  try {
    // Applies the camera's rotation, so the drawn photo is the right way up.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PhotoError("This phone can't open that file. Upload a JPEG, PNG or WebP image.");
  }

  try {
    for (const { side, quality } of ATTEMPTS) {
      const size = fitWithin(bitmap.width, bitmap.height, side);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext("2d");
      if (!context) break;
      // JPEG has no transparency. White matches the page behind the photo.
      context.fillStyle = "#fff";
      context.fillRect(0, 0, size.width, size.height);
      context.drawImage(bitmap, 0, 0, size.width, size.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= SEND_AS_IS_BYTES) return blob;
    }
  } finally {
    bitmap.close();
  }
  throw new PhotoError("This photo is too large to upload. Try a smaller one.");
}

/** A failed upload that may work if the same photo is sent again: no connection, or the server hiccuped. */
export type UploadAttempt = UploadResult | { ok: false; error: string; field?: string; retryable: true };

/** Sends one photo to /api/upload. Never throws: network and server problems come back as messages. */
export function uploadPhoto(projectId: string, photo: Blob): Promise<UploadAttempt> {
  const form = new FormData();
  form.set("projectId", projectId);
  form.set("image", photo, photo instanceof File ? photo.name : "photo.jpg");
  return send("/api/upload", form);
}

/** Sends a portrait to the dedicated profile-picture route. */
export function uploadProfilePicture(photo: Blob): Promise<UploadAttempt> {
  const form = new FormData();
  form.set("image", photo, photo instanceof File ? photo.name : "profile-picture.jpg");
  return send("/api/profile-picture", form);
}

async function send(url: string, form: FormData): Promise<UploadAttempt> {
  let response: Response;
  try {
    response = await fetch(url, { method: "POST", body: form });
  } catch {
    return { ok: false, error: "The upload didn't finish. Check your connection and try again.", retryable: true };
  }
  let result: UploadResult;
  try {
    result = (await response.json()) as UploadResult;
  } catch {
    // The host itself refused, before the app could answer.
    if (response.status === 413) return { ok: false, error: "Image is too large. Upload a file under 4 MB." };
    result = { ok: false, error: "Something went wrong. Please try again." };
  }
  return !result.ok && response.status >= 500 ? { ...result, retryable: true } : result;
}
