import "server-only";
import { notFound } from "next/navigation";
import { getCurrentUser } from "./auth";
import { getServiceContext } from "./server";
import type { SessionUser } from "./services/auth";
import { getStats, listProfilesForAdmin, type Stats } from "./services/admin";
import { audit } from "./services/access";
import { logError } from "./log";

/*
 * Loaders for the admin pages. None are cached: an admin must always see the
 * current state, for example straight after hiding a page.
 */

/**
 * Call first in every admin page. Unauthorized visitors receive the ordinary 404.
 */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) notFound();
  if (!user.isAdmin) {
    try {
      await audit((await getServiceContext()).db, { actorUserId: user.id, action: "admin_denied", target: `user:${user.id}` });
    } catch (error) {
      logError("Record denied admin access", error);
    }
    notFound();
  }
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
