import { getCurrentUser } from "@/lib/auth";
import { getServiceContext } from "@/lib/server";
import { getOwnDashboard } from "@/lib/services/dashboard";
import { SiteMenu } from "./site-menu";

/** Request-time menu details, isolated so public layouts can remain prerendered. */
export async function AuthenticatedSiteMenu() {
  const user = await getCurrentUser();
  if (!user) return <SiteMenu />;

  const dashboard = await getOwnDashboard(await getServiceContext(), user.id);
  const profile = dashboard.profile;
  return (
    <SiteMenu
      account={{
        name: profile?.displayName ?? user.email.split("@")[0]!,
        handle: profile?.handle ?? null,
        profilePictureUrl: profile?.profilePicture?.url ?? null,
      }}
    />
  );
}
