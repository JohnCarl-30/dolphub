import "server-only";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import { getServiceContext } from "./server";
import type { SessionUser } from "./services/auth";
import { getStats, listProfilesForAdmin, type Stats } from "./services/admin";

/*
 * Loaders for the admin pages. None are cached: an admin must always see the
 * current state, for example straight after hiding a page.
 */

/**
 * Call first in every admin page. Signed out goes to /login. Signed in but not
 * an admin gets the ordinary 404, so the page does not advertise that it exists.
 */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) notFound();
  return user;
}

export async function getAdminStats(): Promise<Stats> {
  const user = await requireAdminPage();
  return getStats(await getServiceContext(), user.id);
}

export type AdminProfile = Awaited<ReturnType<typeof listProfilesForAdmin>>[number];

/** The newest 50 profiles, or every hidden one. */
export async function getAdminProfiles(filter: "recent" | "hidden"): Promise<AdminProfile[]> {
  const user = await requireAdminPage();
  return listProfilesForAdmin(await getServiceContext(), user.id, { filter, limit: filter === "hidden" ? 200 : 50 });
}

/** The opportunities item in the public launch gate: at least 10 open posts across at least 3 kinds. */
export const LAUNCH_GATE = { posts: 10, kinds: 3 } as const;
