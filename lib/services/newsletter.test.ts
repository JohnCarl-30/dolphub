import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, type TestEnv } from "../test/helpers";
import { deleteAccount } from "./admin";
import { getNewsletterSubscription, subscribeToNewsletter, unsubscribeFromNewsletter } from "./newsletter";

describe("newsletter", () => {
  let env: TestEnv;
  let student: { id: string };

  beforeEach(async () => {
    env = await createTestContext();
    student = await env.createUser();
  });

  it("stores one subscription per student, lowercased, and replaces it on a second signup", async () => {
    await expect(
      subscribeToNewsletter(env.db, student.id, { email: " Mira.S@Example.com ", topics: ["event", "internship", "event"] }),
    ).resolves.toEqual({ email: "mira.s@example.com", topics: ["internship", "event"] });

    await subscribeToNewsletter(env.db, student.id, { email: "mira@pcu.edu.ph", topics: ["competition"] });
    expect(await getNewsletterSubscription(env.db, student.id)).toEqual({ email: "mira@pcu.edu.ph", topics: ["competition"] });
    const { rows } = await env.client.query("select count(*)::int as n from newsletter_subscriptions");
    expect(rows[0]).toEqual({ n: 1 });
  });

  it("rejects a bad email, no topics, and unknown topics", async () => {
    await expect(subscribeToNewsletter(env.db, student.id, { email: "nope", topics: ["event"] })).rejects.toMatchObject({
      field: "email",
    });
    await expect(subscribeToNewsletter(env.db, student.id, { email: "a@b.co", topics: [] })).rejects.toMatchObject({
      message: "Pick at least one kind of post to hear about.",
    });
    await expect(
      subscribeToNewsletter(env.db, student.id, { email: "a@b.co", topics: ["spam" as "event"] }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(await getNewsletterSubscription(env.db, student.id)).toBeNull();
  });

  it("unsubscribes, and goes away with the account", async () => {
    await subscribeToNewsletter(env.db, student.id, { email: "a@b.co", topics: ["event"] });
    await unsubscribeFromNewsletter(env.db, student.id);
    expect(await getNewsletterSubscription(env.db, student.id)).toBeNull();

    await subscribeToNewsletter(env.db, student.id, { email: "a@b.co", topics: ["event"] });
    await deleteAccount(env.ctx, { actorUserId: student.id, targetUserId: student.id, confirm: true });
    const { rows } = await env.client.query("select count(*)::int as n from newsletter_subscriptions");
    expect(rows[0]).toEqual({ n: 0 });
  });

  it("reads as not subscribed before the migration runs", async () => {
    await env.client.query("drop table newsletter_subscriptions");
    expect(await getNewsletterSubscription(env.db, student.id)).toBeNull();
  });
});
