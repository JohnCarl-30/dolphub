import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { createAdminMcpRoute } from "@/lib/admin-mcp-route";
import { getConfig, getServiceContext } from "@/lib/server";

let handler: ReturnType<typeof createAdminMcpRoute> | undefined;

/** The private admin MCP server. See lib/admin-mcp-route.ts. */
async function handle(request: Request) {
  await connection();
  // Built on first request, so a build without environment variables still succeeds.
  handler ??= createAdminMcpRoute({
    context: getServiceContext,
    token: getConfig().ADMIN_MCP_TOKEN,
    adminEmail: getConfig().ADMIN_MCP_EMAIL,
    // updateTag only works in server actions. Expiring now hides a page on the next visit.
    refresh: (tags) => {
      for (const tag of tags) revalidateTag(tag, { expire: 0 });
    },
  });
  return handler(request);
}

export { handle as GET, handle as POST, handle as DELETE };
