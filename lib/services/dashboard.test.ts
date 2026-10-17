import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, type TestEnv } from "../test/helpers";
import { hideProfile } from "./admin";
import { getOwnDashboard } from "./dashboard";
import { addProjectImage } from "./images";
import { createProfile } from "./profiles";
import { createProject } from "./projects";

describe("getOwnDashboard", () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await createTestContext();
  });

  it("returns courses and no profile for a new student", async () => {
    const u = await env.createUser();
    const d = await getOwnDashboard(env.ctx, u.id);
    expect(d.profile).toBeNull();
    expect(d.courses.map((c) => c.name)).toContain("BS Computer Science");
    expect(d).toMatchObject({ projects: [], imageCount: 0, imageLimit: 10 });
  });

  it("returns the profile, projects in order, images, and hidden state", async () => {
    const admin = await env.createUser({ admin: true });
    const u = await env.createUser();
    await createProfile(env.db, u.id, { handle: "ana", displayName: "Ana", courseId: env.courseId });
    const first = await createProject(env.db, u.id, { title: "First", demoUrl: "https://a.example" });
    await createProject(env.db, u.id, { title: "Second" });
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#000" } }).png().toBuffer();
    await addProjectImage(env.ctx, u.id, first.project.id, png);
    await hideProfile(env.ctx, admin.id, "ana", "Under review");

    const d = await getOwnDashboard(env.ctx, u.id);
    expect(d.profile).toMatchObject({ handle: "ana", isHidden: true, hiddenReason: "Under review", searchVisible: true });
    expect(d.projects.map((p) => p.title)).toEqual(["First", "Second"]);
    expect(d.projects[0]!.images).toHaveLength(1);
    expect(d.projects[0]!.images[0]!.url).toMatch(/^https:\/\/images\.test\/profiles\//);
    expect(d.imageCount).toBe(1);
  });
});
