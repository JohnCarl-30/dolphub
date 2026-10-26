import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { newsletterSubscriptions } from "../db/schema";
import { isMissingRelation } from "./errors";
import { OPPORTUNITY_KINDS, type OpportunityKind } from "./opportunities";
import * as v from "./validation";

export interface NewsletterSubscription {
  email: string;
  /** In the order of OPPORTUNITY_KINDS. */
  topics: OpportunityKind[];
}

const schema = z.object({
  email: v.contactEmail,
  topics: z
    .array(z.enum(OPPORTUNITY_KINDS, "Choose internships, events, competitions or programs"), "Pick at least one kind of post to hear about.")
    .min(1, "Pick at least one kind of post to hear about."),
});

export type SubscribeInput = z.input<typeof schema>;

/** Signs the student up, or replaces their email and topics if they already are. */
export async function subscribeToNewsletter(db: Db, userId: string, input: SubscribeInput): Promise<NewsletterSubscription> {
  const data = v.parse(schema, input);
  const topics = OPPORTUNITY_KINDS.filter((kind) => data.topics.includes(kind));
  await db
    .insert(newsletterSubscriptions)
    .values({ userId, email: data.email, topics })
    .onConflictDoUpdate({
      target: newsletterSubscriptions.userId,
      set: { email: data.email, topics, updatedAt: new Date() },
    });
  return { email: data.email, topics };
}

export async function unsubscribeFromNewsletter(db: Db, userId: string): Promise<void> {
  await db.delete(newsletterSubscriptions).where(eq(newsletterSubscriptions.userId, userId));
}

/** The student's subscription, or null. Also null before the newsletter migration runs, so /home keeps working. */
export async function getNewsletterSubscription(db: Db, userId: string): Promise<NewsletterSubscription | null> {
  try {
    const [row] = await db
      .select({ email: newsletterSubscriptions.email, topics: newsletterSubscriptions.topics })
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.userId, userId));
    return row ? { email: row.email, topics: row.topics as OpportunityKind[] } : null;
  } catch (error) {
    if (isMissingRelation(error, "newsletter_subscriptions")) return null;
    throw error;
  }
}
