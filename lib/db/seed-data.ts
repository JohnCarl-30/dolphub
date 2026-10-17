import type { Db } from "./index";
import { appSettings, courses } from "./schema";

/** Starting list of supported programs. The admin edits this list over time. */
export const TECH_COURSES = [
  "BS Computer Engineering",
  "BS Computer Science",
  "BS Information Technology",
];

/** Adds the course list and the settings row. Safe to run more than once. */
export async function seedBaseData(db: Db): Promise<void> {
  await db
    .insert(courses)
    .values(TECH_COURSES.map((name) => ({ name })))
    .onConflictDoNothing({ target: courses.name });
  await db.insert(appSettings).values({ id: 1 }).onConflictDoNothing({ target: appSettings.id });
}
