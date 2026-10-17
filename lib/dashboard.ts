import "server-only";
import { requireUser } from "./auth";
import { getServiceContext } from "./server";
import { getOwnDashboard, type Dashboard } from "./services/dashboard";

/**
 * Data for the signed-in student's dashboard. Redirects to /login when
 * signed out. Call it inside a <Suspense> boundary, because it reads the session.
 */
export async function getDashboard(): Promise<Dashboard & { email: string }> {
  const user = await requireUser();
  const data = await getOwnDashboard(await getServiceContext(), user.id);
  return { ...data, email: user.email };
}
