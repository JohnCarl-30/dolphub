import { connection, type NextRequest } from "next/server";
import { googleRoutes } from "../routes";

/** Google sends the student back here with a one-time code. */
export async function GET(request: NextRequest) {
  await connection();
  return googleRoutes().callback(request);
}
