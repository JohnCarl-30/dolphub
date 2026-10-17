"use server";

import { updateTag } from "next/cache";
import { ok, toActionError, type ActionResult } from "@/lib/actions/result";
import { requireUser } from "@/lib/auth";
import { OPPORTUNITIES_TAG } from "@/lib/cache-tags";
import { getServiceContext } from "@/lib/server";
import {
  createOpportunity,
  deleteOpportunity,
  setOpportunityHidden,
  updateOpportunity,
  type CreateOpportunityInput,
  type UpdateOpportunityInput,
} from "@/lib/services/opportunities";

/*
 * Admin actions for opportunities. Each checks the session, and the service
 * refuses anyone who is not an admin. Every successful write refreshes the
 * public lists and pages straight away.
 */

/** Dates can be "2026-10-30" (end of that day), "2026-10-30T14:00" (Philippine time), or empty. */
export async function createOpportunityAction(
  input: CreateOpportunityInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await requireUser();
  try {
    const created = await createOpportunity(await getServiceContext(), user.id, input);
    updateTag(OPPORTUNITIES_TAG);
    return ok(created);
  } catch (error) {
    return toActionError(error, "Create opportunity");
  }
}

/** Send only the changed fields. An empty date clears it. The slug never changes. */
export async function updateOpportunityAction(
  id: string,
  input: UpdateOpportunityInput,
): Promise<ActionResult<{ slug: string }>> {
  const user = await requireUser();
  try {
    const result = await updateOpportunity(await getServiceContext(), user.id, id, input);
    updateTag(OPPORTUNITIES_TAG);
    return ok(result);
  } catch (error) {
    return toActionError(error, "Update opportunity");
  }
}

/** Hiding needs a reason, which only admins see. */
export async function setOpportunityHiddenAction(
  id: string,
  hidden: boolean,
  reason?: string,
): Promise<ActionResult<{ slug: string }>> {
  const user = await requireUser();
  try {
    const result = await setOpportunityHidden(await getServiceContext(), user.id, id, hidden, reason);
    updateTag(OPPORTUNITIES_TAG);
    return ok(result);
  } catch (error) {
    return toActionError(error, "Hide opportunity");
  }
}

/** Permanent. Ask the admin to confirm, and prefer hiding. */
export async function deleteOpportunityAction(
  id: string,
  confirm: boolean,
): Promise<ActionResult<{ slug: string }>> {
  const user = await requireUser();
  try {
    const result = await deleteOpportunity(await getServiceContext(), user.id, id, { confirm });
    updateTag(OPPORTUNITIES_TAG);
    return ok(result);
  } catch (error) {
    return toActionError(error, "Delete opportunity");
  }
}
