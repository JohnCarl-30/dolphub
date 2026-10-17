/**
 * Gives an existing user admin rights. The person must have signed in once.
 * Usage: npm run db:make-admin -- someone@pcu.edu.ph
 */
import { eq } from "drizzle-orm";
import { logError } from "../log";
import { users } from "./schema";
import { createNeonDb } from "./neon";

async function main() {
  const url = process.env.DATABASE_URL;
  const email = process.argv[2]?.trim().toLowerCase();
  if (!url) throw new Error("Set DATABASE_URL first");
  if (!email) {
    throw new Error("Pass the email address, for example: npm run db:make-admin -- you@pcu.edu.ph");
  }

  const updated = await createNeonDb(url)
    .update(users)
    .set({ isAdmin: true })
    .where(eq(users.email, email))
    .returning({ id: users.id });
  console.log(updated.length ? `${email} is now an admin.` : `No user with email ${email}. Sign in once first.`);
}

main().catch((error) => {
  logError("Script", error);
  process.exit(1);
});
