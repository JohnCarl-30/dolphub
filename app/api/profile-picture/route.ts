import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { GRID_TAG, profileTag } from "@/lib/cache-tags";
import { getConfig, getServiceContext } from "@/lib/server";
import { createProfilePictureRoute } from "@/lib/upload-route";

let handler: ReturnType<typeof createProfilePictureRoute> | undefined;

/** Adds or replaces the signed-in student's optional public profile picture. */
export async function POST(request: Request) {
  handler ??= createProfilePictureRoute({
    context: getServiceContext,
    currentUser: getCurrentUser,
    appUrl: getConfig().APP_URL,
    refresh: (handle) => {
      revalidateTag(profileTag(handle), { expire: 0 });
      revalidateTag(GRID_TAG, { expire: 0 });
    },
  });
  return handler(request);
}
