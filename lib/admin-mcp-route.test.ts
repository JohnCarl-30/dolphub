import { beforeEach, describe, expect, it } from "vitest";
import { createAdminMcpRoute } from "./admin-mcp-route";
import { adminAuditLog, profiles, users } from "./db/schema";
import { createProfile } from "./services/profiles";
import { getSignupsFrozen } from "./services/settings";
import { createTestContext, type TestEnv } from "./test/helpers";

const TOKEN = "admin-mcp-token-0123456789abcdef0123";
const ADMIN_EMAIL = "admin@pcu.edu.ph";

function post(body: unknown, authorization = `Bearer ${TOKEN}`) {
  return new Request("https://dolphub.tech/api/mcp/admin", {
    method: "POST",
    headers: { authorization, "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify(body),
  });
}

describe("admin MCP route", () => {
  let env: TestEnv;
  let refreshed: string[];
  let route: ReturnType<typeof createAdminMcpRoute>;

  /** Sends one JSON-RPC request and returns its result, read from the SSE reply. */
  async function rpc(method: string, params: unknown) {
    const response = await route(post({ jsonrpc: "2.0", id: 1, method, params }));
    expect(response.status).toBe(200);
    const data = (await response.text()).split("\n").find((line) => line.startsWith("data: "))!;
    return JSON.parse(data.slice("data: ".length));
  }

  async function call(name: string, args: Record<string, unknown> = {}) {
    const { result, error } = await rpc("tools/call", { name, arguments: args });
    if (error) return { isError: true, text: String(error.message) };
    return { isError: result.isError === true, text: result.content[0].text as string };
  }

  beforeEach(async () => {
    env = await createTestContext();
    await env.createUser({ admin: true, email: ADMIN_EMAIL });
    const student = await env.createUser();
    await createProfile(env.db, student.id, { handle: "juan", displayName: "Juan", courseId: env.courseId });
    refreshed = [];
    route = createAdminMcpRoute({
      context: async () => env.ctx,
      token: TOKEN,
      adminEmail: ADMIN_EMAIL,
      refresh: (tags) => refreshed.push(...tags),
    });
  });

  it("refuses requests without the token, and every request until it is set up", async () => {
    for (const header of ["", "Bearer wrong", TOKEN, `Bearer ${TOKEN}x`]) {
      expect((await route(post({}, header))).status).toBe(401);
    }
    const unset = createAdminMcpRoute({ context: async () => env.ctx, token: undefined, adminEmail: ADMIN_EMAIL, refresh: () => {} });
    expect((await unset(post({}))).status).toBe(503);
    const student = createAdminMcpRoute({ context: async () => env.ctx, token: TOKEN, adminEmail: "nobody@pcu.edu.ph", refresh: () => {} });
    expect((await student(post({}))).status).toBe(503);
  });

  it("lists every planned tool", async () => {
    const { result } = await rpc("tools/list", {});
    expect(result.tools.map((t: { name: string }) => t.name).sort()).toEqual([
      "delete_account",
      "get_stats",
      "hide_profile",
      "list_opportunities",
      "list_profiles",
      "post_opportunity",
      "remove_opportunity",
      "set_signups_frozen",
      "unhide_profile",
    ]);
  });

  it("hides and restores a page, audits both, and refreshes the cached pages", async () => {
    expect(await call("hide_profile", { handle: "juan", reason: "scam" })).toMatchObject({ isError: false });
    expect(JSON.parse((await call("list_profiles", { filter: "hidden" })).text)).toMatchObject([
      { handle: "juan", hiddenReason: "scam" },
    ]);
    expect(refreshed).toEqual(["profile:juan", "grid"]);
    await call("unhide_profile", { handle: "juan" });
    const [profile] = await env.db.select().from(profiles);
    expect(profile!.isHidden).toBe(false);
    expect((await env.db.select().from(adminAuditLog)).map((l) => l.action)).toEqual(["hide_profile", "unhide_profile"]);
  });

  it("returns service problems as tool errors", async () => {
    expect(await call("hide_profile", { handle: "nobody", reason: "scam" })).toEqual({
      isError: true,
      text: "No profile with that handle",
    });
    expect(await call("hide_profile", { handle: "juan", reason: "  " })).toMatchObject({ isError: true });
    expect(refreshed).toEqual([]);
  });

  it("freezes signups and reports stats", async () => {
    await call("set_signups_frozen", { frozen: true, reason: "spam wave" });
    expect(await getSignupsFrozen(env.db)).toBe(true);
    expect(JSON.parse((await call("get_stats")).text)).toMatchObject({ signupsFrozen: true, users: 2, target: 50 });
  });

  it("posts and removes an opportunity", async () => {
    const posted = await call("post_opportunity", {
      kind: "internship",
      title: "Software Intern",
      organization: "Accenture",
      summary: "Six months, paid.",
      url: "https://example.com/apply",
      deadline: "2099-12-05",
    });
    expect(posted.isError).toBe(false);
    const { id } = JSON.parse(posted.text);
    expect(refreshed).toEqual(["opportunities"]);
    expect(await call("remove_opportunity", { id, reason: "filled" })).toMatchObject({ isError: false });
    expect(JSON.parse((await call("list_opportunities")).text)).toMatchObject([{ id, isHidden: true }]);
    expect((await call("post_opportunity", { kind: "internship", title: "No deadline", organization: "X", summary: "Y", url: "https://example.com" })).text)
      .toBe("Add the last day to apply");
  });

  it("deletes an account only with confirm: true", async () => {
    expect(await call("delete_account", { handle: "juan", confirm: false })).toMatchObject({ isError: true });
    expect(await env.db.select().from(users)).toHaveLength(2);
    expect(await call("delete_account", { handle: "juan", confirm: true })).toMatchObject({ isError: false });
    expect(await env.db.select().from(users)).toHaveLength(1);
    expect(refreshed).toEqual(["profile:juan", "grid"]);
  });
});
