import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, type TestEnv } from "../test/helpers";
import { createProfile } from "./profiles";
import { createProject, deleteProject, updateProject } from "./projects";

describe("projects", () => {
  let env: TestEnv;
  let owner: { id: string };
  let stranger: { id: string };

  beforeEach(async () => {
    env = await createTestContext();
    owner = await env.createUser();
    stranger = await env.createUser();
    await createProfile(env.db, owner.id, { handle: "owner", displayName: "Owner", courseId: env.courseId });
    await createProfile(env.db, stranger.id, { handle: "stranger", displayName: "S", courseId: env.courseId });
  });

  it("requires https links", async () => {
    await expect(
      createProject(env.db, owner.id, { title: "App", demoUrl: "http://example.com" }),
    ).rejects.toMatchObject({ field: "demoUrl" });
    await expect(
      createProject(env.db, owner.id, { title: "App", sourceUrl: "javascript:alert(1)" }),
    ).rejects.toMatchObject({ field: "sourceUrl" });
    const { project } = await createProject(env.db, owner.id, {
      title: "App",
      demoUrl: "https://app.example.com",
      sourceUrl: "",
    });
    expect(project).toMatchObject({ demoUrl: "https://app.example.com", sourceUrl: null });
  });

  it("adds https:// to a link typed without it", async () => {
    const { project } = await createProject(env.db, owner.id, {
      title: "App",
      demoUrl: " jeep.example.com/map ",
      sourceUrl: "github.com/juan/jeep",
    });
    expect(project).toMatchObject({ demoUrl: "https://jeep.example.com/map", sourceUrl: "https://github.com/juan/jeep" });
    await expect(
      createProject(env.db, owner.id, { title: "App", demoUrl: "not a link" }),
    ).rejects.toMatchObject({ field: "demoUrl" });
  });

  it("orders new projects at the end", async () => {
    const a = await createProject(env.db, owner.id, { title: "A" });
    const b = await createProject(env.db, owner.id, { title: "B" });
    expect([a.project.sortOrder, b.project.sortOrder]).toEqual([0, 1]);
  });

  it("does not let another user edit or delete a project", async () => {
    const { project } = await createProject(env.db, owner.id, { title: "Mine" });
    await expect(updateProject(env.db, stranger.id, project.id, { title: "Stolen" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(deleteProject(env.ctx, stranger.id, project.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(deleteProject(env.ctx, stranger.id, "not-a-uuid")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
