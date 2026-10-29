import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { GRID_TAG, OPPORTUNITIES_TAG, profileTag } from "./cache-tags";
import { sameSecret } from "./cleanup-route";
import { logError } from "./log";
import {
  deleteAccountByHandle,
  getStats,
  hideProfile,
  listProfilesForAdmin,
  setSignupsFrozen,
  unhideProfile,
} from "./services/admin";
import type { ServiceContext } from "./services/context";
import { ServiceError } from "./services/errors";
import {
  createOpportunity,
  listOpportunitiesForAdmin,
  LOCATION_TYPES,
  OPPORTUNITY_KINDS,
  setOpportunityHidden,
} from "./services/opportunities";
import { findActiveUserByEmail } from "./services/signup";

export interface AdminMcpRouteDeps {
  context: () => Promise<ServiceContext>;
  /** ADMIN_MCP_TOKEN. Claude Code sends it as a bearer token. Unset refuses all requests. */
  token: string | undefined;
  /** ADMIN_MCP_EMAIL. Every tool acts, and is audited, as this admin. */
  adminEmail: string | undefined;
  /** Expires cached public pages after a write. */
  refresh: (tags: string[]) => void;
}

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

function text(value: unknown, isError = false): ToolResult {
  const body = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return isError ? { content: [{ type: "text", text: body }], isError } : { content: [{ type: "text", text: body }] };
}

/** Expected problems go back to the assistant as messages. Anything else is logged and hidden. */
async function run(label: string, work: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return text(await work());
  } catch (error) {
    if (error instanceof ServiceError) return text(error.message, true);
    logError(label, error);
    return text("Something went wrong. Please try again.", true);
  }
}

const handle = z.string().describe("The page handle, as in /u/<handle>");
const reason = z.string().describe("Why. Saved in the audit log");
const date = (what: string) =>
  z.string().optional().describe(`${what}: 2026-12-05 (end of that day) or 2026-12-05T14:00, Philippine time`);

function registerTools(server: Parameters<Parameters<typeof createMcpHandler>[0]>[0], ctx: ServiceContext, actor: string, refresh: (tags: string[]) => void) {
  const refreshPage = (h: string) => refresh([profileTag(h), GRID_TAG]);

  server.registerTool(
    "get_stats",
    {
      description: "Active profiles against the semester target, signups this week, hidden pages, the signup freeze, and open opportunities per kind.",
      annotations: { readOnlyHint: true },
    },
    () => run("MCP get_stats", () => getStats(ctx, actor)),
  );

  server.registerTool(
    "list_profiles",
    {
      description: "Newest profiles first, with their project count. Use filter \"hidden\" for taken-down pages.",
      inputSchema: z.object({
        filter: z.enum(["recent", "hidden"]).optional(),
        limit: z.number().int().min(1).max(200).optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    (input) => run("MCP list_profiles", () => listProfilesForAdmin(ctx, actor, input)),
  );

  server.registerTool(
    "hide_profile",
    {
      description: "Takes a student's page down at once. The student sees the reason. Undo with unhide_profile.",
      inputSchema: z.object({ handle, reason }),
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    (input) =>
      run("MCP hide_profile", async () => {
        const result = await hideProfile(ctx, actor, input.handle, input.reason);
        refreshPage(result.handle);
        return result;
      }),
  );

  server.registerTool(
    "unhide_profile",
    {
      description: "Puts a hidden page back up.",
      inputSchema: z.object({ handle }),
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    (input) =>
      run("MCP unhide_profile", async () => {
        const result = await unhideProfile(ctx, actor, input.handle);
        refreshPage(result.handle);
        return result;
      }),
  );

  server.registerTool(
    "set_signups_frozen",
    {
      description: "Freezes or unfreezes new signups. People who already have an account can still sign in.",
      inputSchema: z.object({ frozen: z.boolean(), reason: reason.optional() }),
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    (input) =>
      run("MCP set_signups_frozen", async () => {
        await setSignupsFrozen(ctx, actor, input.frozen, input.reason);
        return { frozen: input.frozen };
      }),
  );

  server.registerTool(
    "list_opportunities",
    {
      description: "Every opportunity, open, closed and hidden, newest first. Gives the ids remove_opportunity needs.",
      annotations: { readOnlyHint: true },
    },
    () => run("MCP list_opportunities", () => listOpportunitiesForAdmin(ctx, actor)),
  );

  server.registerTool(
    "post_opportunity",
    {
      description:
        "Posts an internship, event, competition or program that links out. Internships and programs need a deadline, events a start, and competitions a deadline or a start.",
      // A plain schema for the assistant. The service parses and checks it again.
      inputSchema: z.object({
        kind: z.enum(OPPORTUNITY_KINDS),
        title: z.string().max(120),
        organization: z.string().max(80),
        summary: z.string().max(500),
        url: z.string().describe("https link to the original post"),
        locationType: z.enum(LOCATION_TYPES).optional().describe("Defaults to onsite"),
        location: z.string().max(120).optional(),
        startsAt: date("Start"),
        endsAt: date("End"),
        deadline: date("Last day to apply"),
      }),
      annotations: { destructiveHint: false },
    },
    (input) =>
      run("MCP post_opportunity", async () => {
        const created = await createOpportunity(ctx, actor, input);
        refresh([OPPORTUNITIES_TAG]);
        return created;
      }),
  );

  server.registerTool(
    "remove_opportunity",
    {
      description: "Hides an opportunity from the site. It can be restored from the admin page.",
      inputSchema: z.object({ id: z.string().describe("From list_opportunities or post_opportunity"), reason }),
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    (input) =>
      run("MCP remove_opportunity", async () => {
        const result = await setOpportunityHidden(ctx, actor, input.id, true, input.reason);
        refresh([OPPORTUNITIES_TAG]);
        return result;
      }),
  );

  server.registerTool(
    "delete_account",
    {
      description:
        "Permanently deletes a student's account, page, projects and photos, for a deletion request. Cannot be undone; prefer hide_profile. confirm must be true.",
      inputSchema: z.object({ handle, confirm: z.literal(true) }),
      annotations: { destructiveHint: true },
    },
    (input) =>
      run("MCP delete_account", async () => {
        const result = await deleteAccountByHandle(ctx, actor, input.handle, input.handle);
        refreshPage(result.handle);
        return result;
      }),
  );
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * /api/mcp/admin, the private MCP server for running the site from Claude Code.
 * Every tool calls the same service as the admin page, so every write is audited.
 */
export function createAdminMcpRoute(deps: AdminMcpRouteDeps) {
  return async function handler(request: Request): Promise<Response> {
    if (!deps.token || !deps.adminEmail) return json({ error: "The admin MCP server is not set up." }, 503);
    const header = request.headers.get("authorization") ?? "";
    if (!sameSecret(header, `Bearer ${deps.token}`)) return json({ error: "Not allowed." }, 401);

    const ctx = await deps.context();
    const admin = await findActiveUserByEmail(ctx.db, deps.adminEmail);
    if (!admin?.isAdmin) return json({ error: "ADMIN_MCP_EMAIL is not an active admin." }, 503);

    // Stateless, so a server per request is cheap, and it binds the tools to this admin.
    const mcp = createMcpHandler((server) => registerTools(server, ctx, admin.id, deps.refresh), {
      serverInfo: { name: "dolphub-admin", version: "1.0.0" },
    });
    return mcp(request);
  };
}
