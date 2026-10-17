import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { adminAuditLog, images, profiles, projects, users } from "../db/schema";
import { createTestContext, PCU_DOMAINS, type TestEnv } from "../test/helpers";
import { deleteAccount, getStats, hideProfile, listProfilesForAdmin, setSignupsFrozen, unhideProfile } from "./admin";
import { addProjectImage } from "./images";
import { createProfile, getPublicProfile } from "./profiles";
import { createProject } from "./projects";
import { signInOrRegister } from "./signup";

describe("admin", () => {
  let env: TestEnv;
  let adminId: string;
  let studentId: string;

  beforeEach(async () => {
    env = await createTestContext();
    adminId = (await env.createUser({ admin: true })).id;
    studentId = (await env.createUser()).id;
    await createProfile(env.db, studentId, { handle: "juan", displayName: "Juan", courseId: env.courseId });
  });

  it("refuses non-admins", async () => {
    await expect(getStats(env.ctx, studentId)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(hideProfile(env.ctx, studentId, "juan", "spam")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(getStats(env.ctx, "not-a-uuid")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("counts only visible profiles with a project as active", async () => {
    expect((await getStats(env.ctx, adminId)).activeProfiles).toBe(0);
    await createProject(env.db, studentId, { title: "App" });
    expect(await getStats(env.ctx, adminId)).toMatchObject({ activeProfiles: 1, target: 50, users: 2 });
    await hideProfile(env.ctx, adminId, "juan", "test");
    expect(await getStats(env.ctx, adminId)).toMatchObject({ activeProfiles: 0, hiddenProfiles: 1 });
  });

  it("lists profiles with project counts, and filters hidden ones", async () => {
    await createProject(env.db, studentId, { title: "A" });
    await createProject(env.db, studentId, { title: "B" });
    expect(await listProfilesForAdmin(env.ctx, adminId)).toMatchObject([
      { handle: "juan", projectCount: 2, isHidden: false },
    ]);
    expect(await listProfilesForAdmin(env.ctx, adminId, { filter: "hidden" })).toEqual([]);
    await hideProfile(env.ctx, adminId, "juan", "spam");
    expect(await listProfilesForAdmin(env.ctx, adminId, { filter: "hidden" })).toMatchObject([
      { handle: "juan", hiddenReason: "spam" },
    ]);
  });

  it("hides and restores a page, and logs both with a reason", async () => {
    await expect(hideProfile(env.ctx, adminId, "juan", " ")).rejects.toMatchObject({ code: "VALIDATION" });
    await hideProfile(env.ctx, adminId, "JUAN", "Scam report");
    expect(await getPublicProfile(env.ctx, "juan")).toBeNull();
    await unhideProfile(env.ctx, adminId, "juan");
    expect(await getPublicProfile(env.ctx, "juan")).not.toBeNull();
    const log = await env.db.select().from(adminAuditLog);
    expect(log.map((l) => [l.action, l.reason])).toEqual([
      ["hide_profile", "Scam report"],
      ["unhide_profile", null],
    ]);
  });

  it("freezes signups through the logged kill switch", async () => {
    await setSignupsFrozen(env.ctx, adminId, true, "launch overload");
    await expect(signInOrRegister(env.db, "late@pcu.edu.ph", PCU_DOMAINS)).rejects.toMatchObject({
      code: "SIGNUPS_FROZEN",
    });
    expect((await getStats(env.ctx, adminId)).signupsFrozen).toBe(true);
  });

  it("deletes an account with everything it owns, only when confirmed", async () => {
    const { project } = await createProject(env.db, studentId, { title: "App" });
    const img = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } }).png().toBuffer();
    await addProjectImage(env.ctx, studentId, project.id, img);
    expect(env.storage.objects.size).toBe(1);

    await expect(
      deleteAccount(env.ctx, { actorUserId: adminId, targetUserId: studentId, confirm: false }),
    ).rejects.toMatchObject({ field: "confirm" });
    const other = await env.createUser();
    await expect(
      deleteAccount(env.ctx, { actorUserId: other.id, targetUserId: studentId, confirm: true }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const result = await deleteAccount(env.ctx, { actorUserId: adminId, targetUserId: studentId, confirm: true });
    expect(result).toEqual({ handle: "juan", failedKeys: [] });
    expect(env.storage.objects.size).toBe(0);
    for (const table of [profiles, projects, images]) {
      expect(await env.db.select().from(table)).toHaveLength(0);
    }
    expect((await env.db.select().from(users)).map((u) => u.id)).toEqual([adminId, other.id]);
    const [log] = await env.db.select().from(adminAuditLog);
    expect(log).toMatchObject({ action: "delete_account", target: `user:${studentId}` });
  });

  it("lets a user delete their own account", async () => {
    const result = await deleteAccount(env.ctx, { actorUserId: studentId, targetUserId: studentId, confirm: true });
    expect(result.handle).toBe("juan");
    const [log] = await env.db.select().from(adminAuditLog);
    expect(log).toMatchObject({ action: "self_delete_account", actorUserId: null });
  });
});
