import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { schema } from "../lib/db";
import { seedBaseData } from "../lib/db/seed-data";
import { appSettings, courses, opportunities, profiles, sessions, users } from "../lib/db/schema";
import { closesAtFor } from "../lib/opportunity-time";

export const E2E_SESSION_TOKEN = "dolphub-e2e-session-token";
export const E2E_USER_EMAIL = "feed-test@pcu.edu.ph";
export const E2E_ADMIN_SESSION_TOKEN = "dolphub-e2e-admin-session-token";
export const E2E_ADMIN_EMAIL = "admin-test@pcu.edu.ph";

async function main() {
  await mkdir(".data", { recursive: true });
  const client = new PGlite(".data/e2e-pglite");
  const db = drizzle({ client, schema });

  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await seedBaseData(db);
  await db.insert(users).values({ email: E2E_USER_EMAIL }).onConflictDoNothing({ target: users.email });
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, E2E_USER_EMAIL));

  if (!user) throw new Error("Could not create the browser-test user");

  await storeSession(db, user.id, E2E_SESSION_TOKEN);

  await db
    .insert(users)
    .values({ email: E2E_ADMIN_EMAIL, isAdmin: true })
    .onConflictDoUpdate({ target: users.email, set: { isAdmin: true } });
  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.email, E2E_ADMIN_EMAIL));
  if (!admin) throw new Error("Could not create the browser-test admin");
  await storeSession(db, admin.id, E2E_ADMIN_SESSION_TOKEN);

  await seedOpportunities(db);
  await seedAdminTargets(db);
  await client.close();
}

type E2eDb = ReturnType<typeof drizzle<typeof schema>>;

async function storeSession(db: E2eDb, userId: string, token: string) {
  const expiresAt = new Date("2100-01-01T00:00:00.000Z");
  await db
    .insert(sessions)
    .values({ userId, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt })
    .onConflictDoUpdate({ target: sessions.tokenHash, set: { userId, expiresAt } });
}

/**
 * For e2e/admin.spec.ts: one visible student page per Playwright project, so
 * the desktop and phone runs never hide the same page at once. Signups start open.
 */
async function seedAdminTargets(db: E2eDb) {
  const [course] = await db.select({ id: courses.id }).from(courses).limit(1);
  if (!course) throw new Error("No courses seeded");
  for (const project of ["desktop", "phone"]) {
    const handle = `e2e-hide-${project}`;
    await db.insert(users).values({ email: `${handle}@pcu.edu.ph` }).onConflictDoNothing({ target: users.email });
    const [student] = await db.select({ id: users.id }).from(users).where(eq(users.email, `${handle}@pcu.edu.ph`));
    const row = { userId: student!.id, handle, displayName: `Hide test ${project}`, courseId: course.id, isHidden: false, hiddenReason: null };
    await db.insert(profiles).values(row).onConflictDoUpdate({ target: profiles.handle, set: row });
  }
  await db.update(appSettings).set({ signupsFrozen: false }).where(eq(appSettings.id, 1));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Posts for the /opportunities tests: two open, one closed, one hidden. Dates move with each run. */
async function seedOpportunities(db: E2eDb) {
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
