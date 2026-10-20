import type { ActionResult } from "./actions/result";
import { logError } from "./log";
import type { ServiceContext } from "./services/context";
import { ServiceError, type ServiceErrorCode } from "./services/errors";
import { addProjectImage, IMAGE_LIMITS } from "./services/images";
import type { PublicImage } from "./services/profiles";

export interface UploadRouteDeps {
  context: () => Promise<ServiceContext>;
  /** The signed-in user, or null. */
  currentUser: () => Promise<{ id: string } | null>;
  /** Public origin. Uploads from any other origin are refused. */
  appUrl: string;
  /** Expires the cached public page and home grid for this handle. */
  refresh: (handle: string) => void;
}

export type UploadResult = ActionResult<{ image: PublicImage }>;

const STATUS: Record<ServiceErrorCode, number> = {
  VALIDATION: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  LIMIT_REACHED: 409,
  SIGNUPS_FROZEN: 503,
  UNAVAILABLE: 503,
};

/** Room for the multipart boundaries and the project id around the file. */
const FORM_OVERHEAD_BYTES = 64 * 1024;

function reply(result: UploadResult, status: number): Response {
  return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
}

function fail(error: string, status: number, field?: string): Response {
  return reply(field ? { ok: false, error, field } : { ok: false, error }, status);
}

/**
 * POST /api/upload: multipart form with `projectId` and `image`.
 * Answers with the same shape as a server action, so the editor treats both alike.
 */
export function createUploadRoute(deps: UploadRouteDeps) {
  const origin = new URL(deps.appUrl).origin;

  return async function POST(request: Request): Promise<Response> {
    // The session cookie is SameSite=Lax, which already keeps other sites out. This is a second lock.
    if (request.headers.get("origin") !== origin) return fail("Upload from Dolphub itself.", 403);

    const user = await deps.currentUser();
    if (!user) return fail("Your session ended. Sign in again to add photos.", 401);

    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > IMAGE_LIMITS.maxUploadBytes + FORM_OVERHEAD_BYTES) {
      return fail("Image is too large. Upload a file under 4 MB.", 413, "image");
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail("Send the photo as a form upload.", 400);
    }
    const projectId = form.get("projectId");
    const file = form.get("image");
    if (typeof projectId !== "string" || !projectId) return fail("Choose a project for this photo.", 400);
    if (!(file instanceof Blob) || file.size === 0) return fail("Choose a photo to upload.", 400, "image");
    if (file.size > IMAGE_LIMITS.maxUploadBytes) {
      return fail("Image is too large. Upload a file under 4 MB.", 413, "image");
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { image, handle } = await addProjectImage(await deps.context(), user.id, projectId, bytes);
      deps.refresh(handle);
      return reply({ ok: true, data: { image } }, 201);
    } catch (error) {
      if (error instanceof ServiceError) return fail(error.message, STATUS[error.code], error.field);
      logError("Upload image", error);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}
