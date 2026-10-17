/**
 * Inserts the tech course list and the settings row. Safe to run more than once.
 * Usage: npm run db:seed
 */
import { appSettings, courses } from "./schema";
import { createNeonDb } from "./neon";
import { TECH_COURSES } from "./seed-data";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL first");

  const db = createNeonDb(url);
  await db
    .insert(courses)
    .values(TECH_COURSES.map((name) => ({ name })))
    .onConflictDoNothing({ target: courses.name });
  await db.insert(appSettings).values({ id: 1 }).onConflictDoNothing({ target: appSettings.id });
  console.log(`Seeded ${TECH_COURSES.length} courses and the settings row.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
