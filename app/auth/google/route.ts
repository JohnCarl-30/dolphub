import { connection } from "next/server";
import { googleRoutes } from "./routes";

/** Sends the student to Google's account chooser. */
export async function GET() {
  // Each visit needs fresh secrets, so this must run per request, never at build time.
  await connection();
  return googleRoutes().start();
}
