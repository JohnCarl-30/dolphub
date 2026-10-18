import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { schema } from "../lib/db";
import { seedBaseData } from "../lib/db/seed-data";
import { opportunities, sessions, users } from "../lib/db/schema";
import { closesAtFor } from "../lib/opportunity-time";

export const E2E_SESSION_TOKEN = "dolphub-e2e-session-token";
export const E2E_USER_EMAIL = "feed-test@pcu.edu.ph";

async function main() {
  await mkdir(".data", { recursive: true });
  const client = new PGlite(".data/e2e-pglite");
  const db = drizzle({ client, schema });

  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await seedBaseData(db);
  await db.insert(users).values({ email: E2E_USER_EMAIL }).onConflictDoNothing({ target: users.email });
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, E2E_USER_EMAIL));

  if (!user) throw new Error("Could not create the browser-test user");

  await db
    .insert(sessions)
    .values({
      userId: user.id,
      tokenHash: createHash("sha256").update(E2E_SESSION_TOKEN).digest("hex"),
      expiresAt: new Date("2100-01-01T00:00:00.000Z"),
    })
    .onConflictDoUpdate({
      target: sessions.tokenHash,
      set: { userId: user.id, expiresAt: new Date("2100-01-01T00:00:00.000Z") },
    });

  await seedOpportunities(db);
  await client.close();
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Posts for the /opportunities tests: two open, one closed, one hidden. Dates move with each run. */
async function seedOpportunities(db: ReturnType<typeof drizzle<typeof schema>>) {
  const now = Date.now();
  const at = (days: number) => new Date(now + days * DAY_MS);
  const posts = [
    {
      slug: "e2e-software-intern-a1b2",
      kind: "internship",
      title: "Software engineering intern",
      organization: "Acme Labs",
      summary: "Three months building internal tools with the platform team. Open to 3rd and 4th year students.",
      url: "https://example.com/acme-intern",
      locationType: "onsite",
      location: "Makati",
      startsAt: null,
      endsAt: null,
      deadline: at(20),
      isHidden: false,
    },
    {
      slug: "e2e-cloud-hack-day-c3d4",
      kind: "event",
      title: "Cloud hack day",
      organization: "PCU Computer Science Society",
      summary: "A day of building small cloud projects in teams.",
      url: "https://example.com/cloud-hack-day",
      locationType: "online",
      location: null,
      startsAt: at(5),
      endsAt: at(5.2),
      deadline: null,
      isHidden: false,
    },
    {
      slug: "e2e-closed-scholarship-e5f6",
      kind: "program",
      title: "Closed scholarship",
      organization: "Example Foundation",
      summary: "A scholarship whose deadline has passed.",
      url: "https://example.com/closed-scholarship",
      locationType: "online",
      location: null,
      startsAt: null,
      endsAt: null,
      deadline: at(-2),
      isHidden: false,
    },
    {
      slug: "e2e-hidden-intern-0a0b",
      kind: "internship",
      title: "Hidden internship",
      organization: "Hidden Corp",
      summary: "An admin hid this post.",
      url: "https://example.com/hidden",
      locationType: "onsite",
      location: null,
      startsAt: null,
      endsAt: null,
      deadline: at(10),
      isHidden: true,
    },
  ];
  for (const post of posts) {
    const row = { ...post, closesAt: closesAtFor(post)!, hiddenReason: post.isHidden ? "Test" : null };
    await db.insert(opportunities).values(row).onConflictDoUpdate({ target: opportunities.slug, set: row });
  }
}

void main();
