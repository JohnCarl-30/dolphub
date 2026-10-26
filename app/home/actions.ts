"use server";

import { ok, toActionError, type ActionResult } from "@/lib/actions/result";
import { requireUser } from "@/lib/auth";
import { getServiceContext } from "@/lib/server";
import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  type NewsletterSubscription,
  type SubscribeInput,
} from "@/lib/services/newsletter";

/** Signs the signed-in student up for the opportunities email, or changes their email and topics. */
export async function subscribeAction(input: SubscribeInput): Promise<ActionResult<NewsletterSubscription>> {
  const user = await requireUser();
  try {
    return ok(await subscribeToNewsletter((await getServiceContext()).db, user.id, input));
  } catch (error) {
    return toActionError(error, "Newsletter signup");
  }
}

export async function unsubscribeAction(): Promise<ActionResult> {
  const user = await requireUser();
  try {
    await unsubscribeFromNewsletter((await getServiceContext()).db, user.id);
    return ok(null);
  } catch (error) {
    return toActionError(error, "Newsletter unsubscribe");
  }
}
