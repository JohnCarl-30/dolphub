import { NextResponse, type NextRequest } from "next/server";
import { getServiceContext } from "@/lib/server";
import { getSessionUser } from "@/lib/services/auth";
import { audit } from "@/lib/services/access";
import { logError } from "@/lib/log";

const cookieName = process.env.NODE_ENV === "production" && process.env.E2E_TEST !== "1"
  ? "__Host-session"
  : "session";

/** Reject page requests before React starts streaming, so denial has HTTP status 404. */
export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();

  const token = request.cookies.get(cookieName)?.value;
  if (!token) return NextResponse.rewrite(new URL("/__admin_not_found__", request.url));

  try {
    const context = await getServiceContext();
    const user = await getSessionUser(context, token);
    if (user?.isAdmin) return NextResponse.next();
    if (user) {
      try {
        await audit(context.db, { actorUserId: user.id, action: "admin_denied", target: `user:${user.id}` });
      } catch (error) {
        logError("Record denied admin access", error);
      }
    }
  } catch (error) {
    logError("Check admin access", error);
  }
  return NextResponse.rewrite(new URL("/__admin_not_found__", request.url));
}

export const config = { matcher: "/admin/:path*" };
