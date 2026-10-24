"use server";

import { updateTag } from "next/cache";
import { ok, toActionError, type ActionResult } from "@/lib/actions/result";
import { requireUser } from "@/lib/auth";
import { FEATURED_PROJECTS_TAG, GRID_TAG, profileTag } from "@/lib/cache-tags";
import { getServiceContext } from "@/lib/server";
import { deleteImage, deleteProfilePicture } from "@/lib/services/images";
import {
  createProfile,
  isHandleAvailable,
  updateProfile,
  type CreateProfileInput,
  type UpdateProfileInput,
} from "@/lib/services/profiles";
import {
  createProject,
  deleteProject,
  updateProject,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/services/projects";

/*
 * Dashboard actions. Each one checks the session itself, so it is safe to call
 * from any client code. Signed-out callers are redirected to /login.
 * Every action returns an ActionResult and never throws for expected problems.
 */

/** Shows the change on the student's public page and the home grid straight away. */
function refreshPublicPages(handle: string) {
  updateTag(profileTag(handle));
  updateTag(GRID_TAG);
  updateTag(FEATURED_PROJECTS_TAG);
}

/** For live feedback while a student types a handle. */
export async function checkHandleAction(
  handle: string,
): Promise<ActionResult<{ available: boolean }>> {
  await requireUser();
  try {
    return ok({ available: await isHandleAvailable((await getServiceContext()).db, handle) });
  } catch (error) {
    return toActionError(error, "Check handle");
  }
}

export async function createProfileAction(
  input: CreateProfileInput,
): Promise<ActionResult<{ handle: string }>> {
  const user = await requireUser();
  try {
    const profile = await createProfile((await getServiceContext()).db, user.id, input);
    refreshPublicPages(profile.handle);
    return ok({ handle: profile.handle });
  } catch (error) {
    return toActionError(error, "Create profile");
  }
}

/** Send only the fields that changed. The handle cannot be changed. */
export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<ActionResult<{ handle: string }>> {
  const user = await requireUser();
  try {
    const profile = await updateProfile((await getServiceContext()).db, user.id, input);
    refreshPublicPages(profile.handle);
    return ok({ handle: profile.handle });
  } catch (error) {
    return toActionError(error, "Update profile");
  }
}

export async function createProjectAction(
  input: CreateProjectInput,
): Promise<ActionResult<{ projectId: string }>> {
  const user = await requireUser();
  try {
    const { project, handle } = await createProject((await getServiceContext()).db, user.id, input);
    refreshPublicPages(handle);
    return ok({ projectId: project.id });
  } catch (error) {
    return toActionError(error, "Create project");
  }
}

/** Send only the fields that changed. */
export async function updateProjectAction(
  projectId: string,
  input: UpdateProjectInput,
): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const { handle } = await updateProject((await getServiceContext()).db, user.id, projectId, input);
    refreshPublicPages(handle);
    return ok(null);
  } catch (error) {
    return toActionError(error, "Update project");
  }
}

/** Also deletes the project's images. */
export async function deleteProjectAction(projectId: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const { handle } = await deleteProject(await getServiceContext(), user.id, projectId);
    refreshPublicPages(handle);
    return ok(null);
  } catch (error) {
    return toActionError(error, "Delete project");
  }
}

export async function deleteImageAction(imageId: string): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const { handle } = await deleteImage(await getServiceContext(), user.id, imageId);
    refreshPublicPages(handle);
    return ok(null);
  } catch (error) {
    return toActionError(error, "Delete image");
  }
}

/** Removes the signed-in student's optional public profile picture. */
export async function deleteProfilePictureAction(): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const { handle } = await deleteProfilePicture(await getServiceContext(), user.id);
    refreshPublicPages(handle);
    return ok(null);
  } catch (error) {
    return toActionError(error, "Delete profile picture");
  }
}
