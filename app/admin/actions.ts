"use server";

import { updateTag } from "next/cache";
import { ok, toActionError, type ActionResult } from "@/lib/actions/result";
import { requireUser } from "@/lib/auth";
import { GRID_TAG, profileTag } from "@/lib/cache-tags";
import { getServiceContext } from "@/lib/server";
import { deleteAccountByHandle, hideProfile, setSignupsFrozen, unhideProfile } from "@/lib/services/admin";

/*
 * Moderation actions for the admin page. Each checks the session, and the
 * service refuses anyone who is not an admin. Hiding, restoring and deleting
 * a page refresh it and the home grid straight away.
 */

function refreshPublicPages(handle: string) {
  updateTag(profileTag(handle));
  updateTag(GRID_TAG);
}

/** A reason is required. Only admins and the student see it. */
export async function hideProfileAction(
  handle: string,
  reason: string,
): Promise<ActionResult<{ handle: string }>> {
  const user = await requireUser();
  try {
    const result = await hideProfile(await getServiceContext(), user.id, handle, reason);
    refreshPublicPages(result.handle);
    return ok(result);
  } catch (error) {
    return toActionError(error, "Hide profile");
  }
}

export async function unhideProfileAction(handle: string): Promise<ActionResult<{ handle: string }>> {
  const user = await requireUser();
  try {
    const result = await unhideProfile(await getServiceContext(), user.id, handle);
    refreshPublicPages(result.handle);
    return ok(result);
  } catch (error) {
    return toActionError(error, "Unhide profile");
  }
}

/** Deletes the student's account and everything it owns. `confirmHandle` is the handle, typed by the admin. */
export async function deleteAccountAction(
  handle: string,
  confirmHandle: string,
): Promise<ActionResult<{ handle: string }>> {
  const user = await requireUser();
  try {
    const result = await deleteAccountByHandle(await getServiceContext(), user.id, handle, confirmHandle);
    refreshPublicPages(result.handle);
    return ok(result);
  } catch (error) {
    return toActionError(error, "Delete account");
  }
}

/** Pauses or resumes new signups. People who already have an account can still sign in. */
export async function setSignupsFrozenAction(
  frozen: boolean,
  reason?: string,
): Promise<ActionResult<{ frozen: boolean }>> {
  const user = await requireUser();
  try {
    await setSignupsFrozen(await getServiceContext(), user.id, frozen, reason);
    return ok({ frozen });
  } catch (error) {
    return toActionError(error, "Freeze signups");
  }
}
