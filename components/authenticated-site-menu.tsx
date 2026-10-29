import { getCurrentUser } from "@/lib/auth";
import { unstable_rethrow } from "next/navigation";
import { getServiceContext } from "@/lib/server";
import { getOwnDashboard } from "@/lib/services/dashboard";
import { SiteMenu } from "./site-menu";
import { logError } from "@/lib/log";

/** Request-time menu details, isolated so public layouts can remain prerendered. */
export async function AuthenticatedSiteMenu({ homeHref = "/" }: { homeHref?: "/" | "/home" }) {
  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    unstable_rethrow(error);
    logError("Load menu session", error);
    return <SiteMenu homeHref={homeHref} />;
  }
  if (!user) return <SiteMenu homeHref={homeHref} />;

  let dashboard;
  try {
    dashboard = await getOwnDashboard(await getServiceContext(), user.id);
  } catch (error) {
    unstable_rethrow(error);
    logError("Load menu account details", error);
    return <SiteMenu homeHref={homeHref} account={{ name: user.email.split("@")[0]!, handle: null, profilePictureUrl: null, isAdmin: user.isAdmin }} />;
  }
  const profile = dashboard.profile;
  return (
    <SiteMenu
      homeHref={homeHref}
      account={{
        name: profile?.displayName ?? user.email.split("@")[0]!,
        handle: profile?.handle ?? null,
        profilePictureUrl: profile?.profilePicture?.url ?? null,
        isAdmin: user.isAdmin,
      }}
    />
  );
}
