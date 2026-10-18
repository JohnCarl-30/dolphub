import "server-only";
import { SESSION_COOKIE } from "@/lib/auth";
import { createGoogleRoutes } from "@/lib/google-routes";
import { getConfig, getGoogleSettings, getServiceContext } from "@/lib/server";

let routes: ReturnType<typeof createGoogleRoutes> | undefined;

/** Built on first request, so a build without environment variables still succeeds. */
export function googleRoutes() {
  routes ??= createGoogleRoutes({
    settings: getGoogleSettings,
    context: getServiceContext,
    appUrl: getConfig().APP_URL,
    sessionCookie: SESSION_COOKIE,
    secure: SESSION_COOKIE.startsWith("__Host-"),
  });
  return routes;
}
