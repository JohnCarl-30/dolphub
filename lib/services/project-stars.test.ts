import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, type TestEnv } from "../test/helpers";
import { createProject } from "./projects";
import { createProfile, getPublicProfile, listFeaturedProjects } from "./profiles";
import { isMissingRelation } from "./errors";
import { setProjectStar, starredProjectIds } from "./project-stars";

describe("project stars", () => {
  let env: TestEnv;
  let owner: { id: string };
  let student: { id: string };
  let projectId: string;

  beforeEach(async () => {
    env = await createTestContext();
    owner = await env.createUser();
    student = await env.createUser();
    await createProfile(env.db, owner.id, { handle: "owner", displayName: "Owner", courseId: env.courseId });
    const project = await createProject(env.db, owner.id, { title: "Project" });
    projectId = project.project.id;
  });

  it("adds and removes one star per student", async () => {
    await expect(setProjectStar(env.db, student.id, projectId, true)).resolves.toMatchObject({ starCount: 1, starred: true });
    await expect(setProjectStar(env.db, student.id, projectId, true)).resolves.toMatchObject({ starCount: 1, starred: true });
    expect(await starredProjectIds(env.db, student.id, [projectId])).toEqual(new Set([projectId]));
    await expect(setProjectStar(env.db, student.id, projectId, false)).resolves.toMatchObject({ starCount: 0, starred: false });
    expect((await getPublicProfile(env.ctx, "owner"))?.projects[0]?.starCount).toBe(0);
  });

  it("rejects self-stars and unknown projects", async () => {
    await expect(setProjectStar(env.db, owner.id, projectId, true)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(setProjectStar(env.db, student.id, "not-a-uuid", true)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("ranks by stars then newest project and keeps one project per student", async () => {
    const second = await createProject(env.db, owner.id, { title: "Owner second" });
    const other = await env.createUser();
    await createProfile(env.db, other.id, { handle: "other", displayName: "Other", courseId: env.courseId });
    await createProject(env.db, other.id, { title: "Other project" });
    const voterTwo = await env.createUser();
    await setProjectStar(env.db, student.id, projectId, true);
    await setProjectStar(env.db, voterTwo.id, projectId, true);
    await setProjectStar(env.db, student.id, second.project.id, true);
    const featured = await listFeaturedProjects(env.ctx);
    expect(featured.map((project) => project.title)).toEqual(["Project", "Other project"]);
  });

  it("leaves hidden projects out of the ranking", async () => {
    await env.client.query("update profiles set is_hidden = true where handle = 'owner'");
    expect(await listFeaturedProjects(env.ctx)).toEqual([]);
  });

  it("keeps profiles and recent projects available before the stars migration", async () => {
    await createProject(env.db, owner.id, { title: "Owner second" });
    const other = await env.createUser();
    await createProfile(env.db, other.id, { handle: "other", displayName: "Other", courseId: env.courseId });
    await createProject(env.db, other.id, { title: "Other project" });
    const hidden = await env.createUser();
    await createProfile(env.db, hidden.id, { handle: "hidden", displayName: "Hidden", courseId: env.courseId });
    await createProject(env.db, hidden.id, { title: "Hidden project" });
    await env.client.query("update profiles set is_hidden = true where handle = 'hidden'");
    await env.client.query("drop table project_stars");

    const profile = await getPublicProfile(env.ctx, "owner", { includeStars: false });
    expect(profile).toMatchObject({ starsAvailable: false });
    expect(profile?.projects.map((project) => project.starCount)).toEqual([null, null]);

    const featured = await listFeaturedProjects(env.ctx, 3, { includeStars: false });
    expect(featured.map((project) => project.title)).toEqual(["Other project", "Owner second"]);
    expect(featured.map((project) => project.starCount)).toEqual([null, null]);

    try {
      await listFeaturedProjects(env.ctx);
      expect.unreachable("the normal ranking should query the missing project_stars table");
    } catch (error) {
      expect(isMissingRelation(error, "project_stars")).toBe(true);
    }
  });
});
