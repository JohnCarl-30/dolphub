import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { schema, type Db } from "../db";
import { appSettings, courses, users } from "../db/schema";
import { TECH_COURSES } from "../db/seed-data";
import type { ServiceContext } from "../services/context";
import { MemoryStorage } from "../storage/memory";

export const PCU_DOMAINS = ["pcu.edu.ph"];

/** A fresh in-memory Postgres with migrations and seed data applied. */
export async function createTestContext() {
  const client = new PGlite();
  const pglite = drizzle({ client, schema });
  await migrate(pglite, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await pglite.insert(courses).values(TECH_COURSES.map((name) => ({ name })));
  await pglite.insert(appSettings).values({ id: 1 });

  const db = pglite as unknown as Db;
  const storage = new MemoryStorage();
  const ctx: ServiceContext = { db, storage };
  const courseRows = await db.select().from(courses);
  const courseId = courseRows[0]!.id;

  let n = 0;
  async function createUser(options: { admin?: boolean; email?: string } = {}) {
    const email = options.email ?? `student${++n}@pcu.edu.ph`;
    const [user] = await db
      .insert(users)
      .values({ email, isAdmin: options.admin ?? false })
      .returning();
    return user!;
  }

  return { ctx, db, storage, client, courseId, createUser, users, eq };
}

export type TestEnv = Awaited<ReturnType<typeof createTestContext>>;
