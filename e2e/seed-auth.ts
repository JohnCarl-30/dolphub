import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { schema } from "../lib/db";
import { seedBaseData } from "../lib/db/seed-data";
import { sessions, users } from "../lib/db/schema";

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

  await client.close();
}

void main();
