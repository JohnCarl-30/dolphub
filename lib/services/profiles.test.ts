import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, type TestEnv } from "../test/helpers";
import { createProfile, getPublicProfile, listGridProfiles, listIndexableProfiles, updateProfile } from "./profiles";
import { createProject, updateProject } from "./projects";

describe("profiles", () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await createTestContext();
  });

  const base = (env: TestEnv) => ({
    handle: "juan",
    displayName: "Juan Cruz",
    courseId: env.courseId,
  });

  it("creates one profile per user and keeps handles unique", async () => {
    const a = await env.createUser();
    const b = await env.createUser();
    await createProfile(env.db, a.id, base(env));
    await expect(createProfile(env.db, a.id, { ...base(env), handle: "juan2" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(createProfile(env.db, b.id, { ...base(env), handle: "JUAN" })).rejects.toMatchObject({
      code: "CONFLICT",
      field: "handle",
    });
  });

  it("rejects unsupported courses and non-Messenger links", async () => {
    const u = await env.createUser();
    await expect(createProfile(env.db, u.id, { ...base(env), courseId: 9999 })).rejects.toMatchObject({
      field: "courseId",
    });
    await expect(
      createProfile(env.db, u.id, { ...base(env), messengerUrl: "https://evil.example/m.me/juan" }),
    ).rejects.toMatchObject({ field: "messengerUrl" });
    const ok = await createProfile(env.db, u.id, { ...base(env), messengerUrl: "https://m.me/juan" });
    expect(ok.messengerUrl).toBe("https://m.me/juan");
    const updated = await updateProfile(env.db, u.id, { messengerUrl: "m.me/juan.cruz" });
    expect(updated.messengerUrl).toBe("https://m.me/juan.cruz");
  });

  it("shows pages in search engines by default, and lets the student opt out", async () => {
    const u = await env.createUser();
    const p = await createProfile(env.db, u.id, base(env));
    expect(p.searchVisible).toBe(true);
    expect((await getPublicProfile(env.ctx, "juan"))?.searchVisible).toBe(true);
    await updateProfile(env.db, u.id, { searchVisible: false });
    expect((await getPublicProfile(env.ctx, "juan"))?.searchVisible).toBe(false);
    await expect(updateProfile(env.db, u.id, { searchVisible: "no" } as never)).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("does not allow changing the handle", async () => {
    const u = await env.createUser();
    await createProfile(env.db, u.id, base(env));
    await expect(updateProfile(env.db, u.id, { handle: "other" } as never)).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("hides hidden profiles and deleted users from the public page", async () => {
    const u = await env.createUser();
    const p = await createProfile(env.db, u.id, base(env));
    expect(await getPublicProfile(env.ctx, "JUAN")).toMatchObject({ handle: "juan", projects: [] });

    await env.client.query("update profiles set is_hidden = true where id = $1", [p.id]);
    expect(await getPublicProfile(env.ctx, "juan")).toBeNull();

    await env.client.query("update profiles set is_hidden = false where id = $1", [p.id]);
    await env.client.query("update users set deleted_at = now() where id = $1", [u.id]);
    expect(await getPublicProfile(env.ctx, "juan")).toBeNull();
  });

  it("keeps public profiles available with initials when the optional portrait migration is pending", async () => {
    const u = await env.createUser();
    await createProfile(env.db, u.id, base(env));
    await env.client.query("drop table profile_pictures");

    await expect(getPublicProfile(env.ctx, "juan")).resolves.toMatchObject({
      handle: "juan",
      profilePicture: null,
    });
  });

  it("lists only profiles with a project in the grid, newest first, with paging", async () => {
    const handles = ["ana", "ben", "cara"];
    for (const handle of handles) {
      const u = await env.createUser();
      await createProfile(env.db, u.id, { ...base(env), handle });
      if (handle !== "ben") await createProject(env.db, u.id, { title: `${handle} app` });
    }
    const all = await listGridProfiles(env.ctx);
    expect(all.map((c) => c.handle)).toEqual(["cara", "ana"]);
    expect(all[0]!.featuredProject).toEqual({ title: "cara app", description: "" });

    const firstPage = await listGridProfiles(env.ctx, { limit: 1 });
    const last = firstPage[0]!;
    const next = await listGridProfiles(env.ctx, {
      limit: 1,
      after: { createdAt: last.createdAt, id: last.id },
    });
    expect(next.map((c) => c.handle)).toEqual(["ana"]);
  });

  it("features each grid profile's first project in the student's order", async () => {
    const u = await env.createUser();
    await createProfile(env.db, u.id, base(env));
    const first = await createProject(env.db, u.id, { title: "First", description: "Made first" });
    const second = await createProject(env.db, u.id, { title: "Second", description: "Moved up" });
    expect((await listGridProfiles(env.ctx))[0]!.featuredProject.title).toBe("First");

    await updateProject(env.db, u.id, first.project.id, { sortOrder: 2 });
    await updateProject(env.db, u.id, second.project.id, { sortOrder: 1 });
    expect((await listGridProfiles(env.ctx))[0]!.featuredProject).toEqual({ title: "Second", description: "Moved up" });
  });

  it("lists only visible pages that allow search engines for the sitemap", async () => {
    for (const handle of ["ana", "ben", "cara"]) {
      const u = await env.createUser();
      await createProfile(env.db, u.id, { ...base(env), handle });
      if (handle === "ben") await updateProfile(env.db, u.id, { searchVisible: false });
    }
    await env.client.query("update profiles set is_hidden = true where handle = 'cara'");
    const rows = await listIndexableProfiles(env.ctx);
    expect(rows.map((r) => r.handle)).toEqual(["ana"]);
    expect(rows[0]!.updatedAt).toBeInstanceOf(Date);
  });
});
