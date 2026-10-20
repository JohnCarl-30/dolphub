import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { GRID_TAG, profileTag } from "@/lib/cache-tags";
import { getConfig, getServiceContext } from "@/lib/server";
import { createUploadRoute } from "@/lib/upload-route";

let handler: ReturnType<typeof createUploadRoute> | undefined;

/** Adds a photo to one of the signed-in student's projects. See lib/upload-route.ts. */
export async function POST(request: Request) {
  // Built on first request, so a build without environment variables still succeeds.
  handler ??= createUploadRoute({
    context: getServiceContext,
    currentUser: getCurrentUser,
    appUrl: getConfig().APP_URL,
    // updateTag only works in server actions. Expiring now still shows the photo on the next visit.
    refresh: (handle) => {
      revalidateTag(profileTag(handle), { expire: 0 });
      revalidateTag(GRID_TAG, { expire: 0 });
    },
  });
  return handler(request);
}
