import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { schema } from "../lib/db";
import { seedBaseData } from "../lib/db/seed-data";
import { appSettings, courses, opportunities, profiles, projects, sessions, users } from "../lib/db/schema";
import { closesAtFor } from "../lib/opportunity-time";

export const E2E_SESSION_TOKEN = "dolphub-e2e-session-token";
export const E2E_USER_EMAIL = "feed-test@pcu.edu.ph";
export const E2E_ADMIN_SESSION_TOKEN = "dolphub-e2e-admin-session-token";
export const E2E_ADMIN_EMAIL = "admin-test@pcu.edu.ph";
export const E2E_LOGOUT_PROJECTS = ["desktop", "phone"];
/** Isolated no-profile accounts for profile details and projects browser flows. */
export const E2E_NEWCOMER_PROJECTS = [
  "desktop", "phone", "details-desktop", "details-phone",
  "projects-desktop", "projects-phone", "projects-empty-desktop", "projects-empty-phone",
];

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
  await seedStudents(db);
  await seedFeedStudentProfile(db, user.id);
  await seedNewcomers(db);
  await seedLogoutUsers(db);
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
 * For e2e/admin.spec.ts: one visible student page to hide and one account to
 * delete per Playwright project, so the desktop and phone runs never touch the
 * same page at once. A deleted account is created again on the next run. Signups start open.
 */
async function seedAdminTargets(db: E2eDb) {
  const [course] = await db.select({ id: courses.id }).from(courses).limit(1);
  if (!course) throw new Error("No courses seeded");
  for (const project of ["desktop", "phone"]) {
    for (const [kind, name] of [["hide", "Hide"], ["delete", "Delete"]]) {
      const handle = `e2e-${kind}-${project}`;
      await db.insert(users).values({ email: `${handle}@pcu.edu.ph` }).onConflictDoNothing({ target: users.email });
      const [student] = await db.select({ id: users.id }).from(users).where(eq(users.email, `${handle}@pcu.edu.ph`));
      const row = { userId: student!.id, handle, displayName: `${name} test ${project}`, courseId: course.id, isHidden: false, hiddenReason: null };
      await db.insert(profiles).values(row).onConflictDoUpdate({ target: profiles.handle, set: row });
    }
  }
  await db.update(appSettings).set({ signupsFrozen: false }).where(eq(appSettings.id, 1));
}

/**
 * Published student pages for the home showcase and /u/<handle> tests, one per
 * course and one with two projects. lea has no project, so the grid leaves her out.
 */
const STUDENTS = [
  {
    handle: "mira",
    displayName: "Mira Santos",
    tagline: "Campus apps for people who still use Messenger.",
    course: "BS Information Technology",
    messengerUrl: "https://m.me/mira.santos.pcu",
    githubUsername: "mira-santos",
    contactEmail: "mira.santos@example.com",
    projects: [
      { title: "OrgFair", description: "A phone-sized directory of PCU student orgs with meeting rooms and join links.", demoUrl: "https://example.com/orgfair", sourceUrl: "https://github.com/example/orgfair" },
      { title: "Lost & Found locker", description: "Photo log of items left at the library desk, searchable by building.", demoUrl: null, sourceUrl: "https://github.com/example/locker" },
    ],
  },
  {
    handle: "kenji",
    displayName: "Kenji Ramos",
    tagline: "Embedded projects that still compile on a lab PC.",
    course: "BS Computer Engineering",
    messengerUrl: "https://m.me/kenji.ramos.pcu",
    githubUsername: "kenji-ramos",
    contactEmail: null,
    projects: [
      { title: "Lab gate logger", description: "RFID check-in for the CpE lab, with a public occupancy page.", demoUrl: "https://example.com/lab-gate", sourceUrl: "https://github.com/example/lab-gate" },
    ],
  },
  {
    handle: "aisha",
    displayName: "Aisha Villanueva",
    tagline: "Small tools for class groups that hate shared drives.",
    course: "BS Computer Science",
    messengerUrl: "https://m.me/aisha.villanueva.pcu",
    githubUsername: null,
    contactEmail: null,
    projects: [
      { title: "Section notes", description: "A write-once note wall for one CS section, with a public read page.", demoUrl: "https://example.com/section-notes", sourceUrl: null },
    ],
  },
  {
    handle: "paolo",
    displayName: "Paolo Cruz",
    tagline: "Maps and schedules, nothing fancier than a phone can load.",
    course: "BS Information Technology",
    messengerUrl: null,
    githubUsername: null,
    contactEmail: null,
    projects: [
      { title: "Jeep wait", description: "Crowd-reported wait times for the common jeepney stops near campus.", demoUrl: "https://example.com/jeep-wait", sourceUrl: "https://github.com/example/jeep-wait" },
    ],
  },
  {
    handle: "lea",
    displayName: "Lea Mendoza",
    tagline: "Still writing the first project.",
    course: "BS Computer Science",
    messengerUrl: "https://m.me/lea.mendoza.pcu",
    githubUsername: null,
    contactEmail: null,
    projects: [],
  },
];

async function seedStudents(db: E2eDb) {
  const courseRows = await db.select({ id: courses.id, name: courses.name }).from(courses);
  for (const { course, projects: list, ...student } of STUDENTS) {
    const courseId = courseRows.find((c) => c.name === course)?.id;
    if (!courseId) throw new Error(`Course not seeded: ${course}`);
    const email = `${student.handle}-e2e@pcu.edu.ph`;
    await db.insert(users).values({ email }).onConflictDoNothing({ target: users.email });
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    const row = { ...student, userId: user!.id, courseId, isHidden: false, hiddenReason: null };
    const [profile] = await db
      .insert(profiles)
      .values(row)
      .onConflictDoUpdate({ target: profiles.handle, set: row })
      .returning({ id: profiles.id });
    // Rewrite projects each run, so edits here show up and nothing doubles.
    await db.delete(projects).where(eq(projects.profileId, profile!.id));
    if (list.length > 0) {
      await db.insert(projects).values(list.map((p, sortOrder) => ({ ...p, profileId: profile!.id, sortOrder })));
    }
  }
}

/** The feed-test student gets a page with no projects, so the dashboard and editor have a profile to show. */
async function seedFeedStudentProfile(db: E2eDb, userId: string) {
  const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.name, "BS Information Technology"));
  const row = {
    userId,
    handle: "feed-test",
    displayName: "Feed Tester",
    tagline: "Testing the dashboard.",
    courseId: course!.id,
    messengerUrl: null,
    githubUsername: null,
    contactEmail: null,
    searchVisible: true,
    isHidden: false,
    hiddenReason: null,
  };
  const [profile] = await db
    .insert(profiles)
    .values(row)
    .onConflictDoUpdate({ target: profiles.handle, set: row })
    .returning({ id: profiles.id });
  await db.delete(projects).where(eq(projects.profileId, profile!.id));
}

/** Signed-in accounts with no profile yet. Each run starts them over, so the create flow always runs. */
async function seedNewcomers(db: E2eDb) {
  for (const project of E2E_NEWCOMER_PROJECTS) {
    const email = `newcomer-${project}@pcu.edu.ph`;
    await db.insert(users).values({ email }).onConflictDoNothing({ target: users.email });
    const [newcomer] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    await db.delete(profiles).where(eq(profiles.userId, newcomer!.id));
    await storeSession(db, newcomer!.id, `dolphub-e2e-newcomer-${project}`);
  }
}

/** Isolated accounts for logout tests, so signing out cannot invalidate another parallel test's session. */
async function seedLogoutUsers(db: E2eDb) {
  for (const project of E2E_LOGOUT_PROJECTS) {
    const email = `logout-${project}@pcu.edu.ph`;
    await db.insert(users).values({ email }).onConflictDoNothing({ target: users.email });
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    await storeSession(db, user!.id, `dolphub-e2e-logout-${project}`);
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Posts for the /opportunities and home page tests: three open, one closed, one hidden. Dates move with each run.
 * The competition closes tomorrow, so it leads the home strip and fills the focus band.
 */
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
      slug: "e2e-team-ctf-f7g8",
      kind: "competition",
      title: "Team capture-the-flag",
      organization: "PCU IT Society",
      summary: "A one-day CTF for teams of four.",
      url: "https://example.com/team-ctf",
      locationType: "online",
      location: null,
      startsAt: null,
      endsAt: null,
      deadline: at(1),
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
