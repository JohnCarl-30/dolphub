"use server";

import { updateTag } from "next/cache";
import { ok, toActionError, type ActionResult } from "@/lib/actions/result";
import { requireUser } from "@/lib/auth";
import { FEATURED_PROJECTS_TAG, profileTag } from "@/lib/cache-tags";
import { logError } from "@/lib/log";
import { getServiceContext } from "@/lib/server";
import { isMissingRelation } from "@/lib/services/errors";
import { setProjectStar } from "@/lib/services/project-stars";

/** Changes a star and refreshes only the affected public profile and landing ranking. */
export async function setProjectStarAction(
  projectId: string,
  starred: boolean,
): Promise<ActionResult<{ starCount: number; starred: boolean }>> {
  const user = await requireUser();
  try {
    const result = await setProjectStar((await getServiceContext()).db, user.id, projectId, starred);
    updateTag(profileTag(result.handle));
    updateTag(FEATURED_PROJECTS_TAG);
    return ok({ starCount: result.starCount, starred: result.starred });
  } catch (error) {
    if (isMissingRelation(error, "project_stars")) {
      logError("Star project unavailable", error);
      return { ok: false, error: "Project stars are temporarily unavailable." };
    }
    return toActionError(error, "Star project");
  }
}
