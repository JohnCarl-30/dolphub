import { connection, type NextRequest } from "next/server";
import { googleRoutes } from "./routes";

/** Sends the student to Google's account chooser. ?next= is where to return after sign-in. */
export async function GET(request: NextRequest) {
  // Each visit needs fresh secrets, so this must run per request, never at build time.
  await connection();
  return googleRoutes().start(request.nextUrl.searchParams.get("next"));
}
