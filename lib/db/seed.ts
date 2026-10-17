/**
 * Inserts the tech course list and the settings row. Safe to run more than once.
 * Usage: npm run db:seed
 */
import { createNeonDb } from "./neon";
import { seedBaseData, TECH_COURSES } from "./seed-data";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL first");
  await seedBaseData(createNeonDb(url));
  console.log(`Seeded ${TECH_COURSES.length} courses and the settings row.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
