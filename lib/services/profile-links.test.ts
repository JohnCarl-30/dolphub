import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, type TestEnv } from "../test/helpers";
import { profilePageJsonLd, serializeJsonLd, type SeoProfile } from "../seo";
import {
  createProfile,
  getPublicProfile,
  listGridProfiles,
  updateProfile,
} from "./profiles";
import { createProject } from "./projects";

// Acceptance tests for the profile GitHub and contact email fields.

describe("profile GitHub and contact email", () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await createTestContext();
  });

  const base = (env: TestEnv) => ({
    handle: "juan",
    displayName: "Juan Cruz",
    courseId: env.courseId,
  });

  it("starts with both fields empty, and never copies the sign-in email", async () => {
    const u = await env.createUser();
    const p = await createProfile(env.db, u.id, base(env));
    expect(p.githubUsername).toBeNull();
    expect(p.contactEmail).toBeNull();
  });

  it("stores a bare username and a pasted profile URL as the username", async () => {
    const u = await env.createUser();
    const created = await createProfile(env.db, u.id, {
      ...base(env),
      ...{ githubUsername: "octocat" },
    });
    expect(created.githubUsername).toBe("octocat");

    for (const pasted of [
      "https://github.com/hubot",
      "https://github.com/hubot/",
      "  https://www.github.com/hubot  ",
      "github.com/hubot",
    ]) {
      const updated = await updateProfile(env.db, u.id, {
        githubUsername: pasted,
      });
      expect(updated.githubUsername).toBe("hubot");
    }
  });

  it.each([
    ["a leading hyphen", "-bad"],
    ["a trailing hyphen", "bad-"],
    ["consecutive hyphens", "a--b"],
    ["40 characters", "a".repeat(40)],
    ["a repository path", "github.com/octocat/hello-world"],
    ["another host", "https://gitlab.com/octocat"],
    ["a plain http link", "http://github.com/octocat"],
    ["a javascript link", "javascript:alert(1)"],
    ["an underscore", "octo_cat"],
    ["a space inside", "octo cat"],
  ])("rejects a GitHub username with %s", async (_label, value) => {
    const u = await env.createUser();
    await createProfile(env.db, u.id, base(env));
    await expect(
      updateProfile(env.db, u.id, { githubUsername: value }),
    ).rejects.toMatchObject({
      code: "VALIDATION",
      field: "githubUsername",
    });
  });

  it("accepts a 39 character username and a single hyphen", async () => {
    const u = await env.createUser();
    await createProfile(env.db, u.id, base(env));
    const longest = "a".repeat(39);
    const a = await updateProfile(env.db, u.id, { githubUsername: longest });
    expect(a.githubUsername).toBe(longest);
    const b = await updateProfile(env.db, u.id, {
      githubUsername: "mona-lisa",
    });
    expect(b.githubUsername).toBe("mona-lisa");
  });

  it("stores the contact email lowercase and trimmed, and accepts any domain", async () => {
    const u = await env.createUser();
    await createProfile(env.db, u.id, base(env));
    const updated = await updateProfile(env.db, u.id, {
      contactEmail: "  Juan.Cruz@Gmail.com ",
    });
    expect(updated.contactEmail).toBe("juan.cruz@gmail.com");
  });

  it.each([
    ["no at sign", "juan.example.com"],
    ["no domain", "juan@"],
    ["no name", "@example.com"],
    ["a space inside", "ju an@example.com"],
    ["two at signs", "a@b@example.com"],
    ["more than 254 characters", `${"a".repeat(250)}@example.com`],
  ])("rejects a contact email with %s", async (_label, value) => {
    const u = await env.createUser();
    await createProfile(env.db, u.id, base(env));
    await expect(
      updateProfile(env.db, u.id, { contactEmail: value }),
    ).rejects.toMatchObject({
      code: "VALIDATION",
      field: "contactEmail",
    });
  });

  it("clears either field with an empty string and leaves the other alone", async () => {
    const u = await env.createUser();
    await createProfile(env.db, u.id, {
      ...base(env),
      ...{ githubUsername: "octocat", contactEmail: "juan@example.com" },
    });

    const noGithub = await updateProfile(env.db, u.id, { githubUsername: "" });
    expect(noGithub).toMatchObject({
      githubUsername: null,
      contactEmail: "juan@example.com",
    });

    const noEmail = await updateProfile(env.db, u.id, { contactEmail: "" });
    expect(noEmail).toMatchObject({ githubUsername: null, contactEmail: null });
  });

  it("leaves both fields alone when an update does not mention them", async () => {
    const u = await env.createUser();
    await createProfile(env.db, u.id, {
      ...base(env),
      ...{ githubUsername: "octocat", contactEmail: "juan@example.com" },
    });
    const updated = await updateProfile(env.db, u.id, {
      tagline: "Builds campus apps",
    });
    expect(updated).toMatchObject({
      githubUsername: "octocat",
      contactEmail: "juan@example.com",
    });
  });

  it("shows both fields on the public page, and nothing when they are not set", async () => {
    const withLinks = await env.createUser();
    await createProfile(env.db, withLinks.id, {
      ...base(env),
      ...{ githubUsername: "octocat", contactEmail: "juan@example.com" },
    });
    expect(await getPublicProfile(env.ctx, "juan")).toMatchObject({
      githubUsername: "octocat",
      contactEmail: "juan@example.com",
    });

    const without = await env.createUser();
    await createProfile(env.db, without.id, { ...base(env), handle: "maria" });
    expect(await getPublicProfile(env.ctx, "maria")).toMatchObject({
      githubUsername: null,
      contactEmail: null,
    });
  });

  it("removes the contact email with the rest of the page when the profile is hidden or the user is deleted", async () => {
    const u = await env.createUser();
    const p = await createProfile(env.db, u.id, {
      ...base(env),
      ...{ contactEmail: "juan@example.com" },
    });
    await env.client.query(
      "update profiles set is_hidden = true where id = $1",
      [p.id],
    );
    expect(await getPublicProfile(env.ctx, "juan")).toBeNull();

    await env.client.query(
      "update profiles set is_hidden = false where id = $1",
      [p.id],
    );
    await env.client.query(
      "update users set deleted_at = now() where id = $1",
      [u.id],
    );
    expect(await getPublicProfile(env.ctx, "juan")).toBeNull();
  });

  describe("privacy", () => {
    const EMAIL = "private.contact@example.com";

    it("keeps the contact email out of the home grid", async () => {
      const u = await env.createUser();
      await createProfile(env.db, u.id, {
        ...base(env),
        ...{ contactEmail: EMAIL },
      });
      await createProject(env.db, u.id, { title: "Orgfair" });
      const grid = await listGridProfiles(env.ctx);
      expect(grid).toHaveLength(1);
      expect(JSON.stringify(grid)).not.toContain(EMAIL);
    });

    it("keeps the contact email out of the structured data search engines read", () => {
      const seoProfile: SeoProfile = {
        handle: "juan",
        displayName: "Juan Cruz",
        tagline: "Builds campus apps",
        courseName: "BS Information Technology",
        coverImageUrl: null,
        updatedAt: null,
        source: "real",
        searchVisible: true,
      };
      // Even if a caller passes the whole public profile, the email must not be serialized.
      const withEmail = { ...seoProfile, contactEmail: EMAIL } as SeoProfile;
      const json = serializeJsonLd(
        profilePageJsonLd(withEmail, "https://dolphub.tech"),
      );
      expect(json).not.toContain(EMAIL);
      expect(json).not.toContain("@example.com");
    });
  });
});
