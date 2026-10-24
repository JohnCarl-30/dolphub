import { describe, expect, it } from "vitest";
import {
  changedProfileFields,
  hasChanges,
  planProjectSaves,
  profileFields,
  projectFields,
  type ProfileFields,
  type ProjectFields,
} from "./profile-form";

const profile = {
  handle: "juan",
  displayName: "Juan Cruz",
  tagline: "",
  courseId: 3,
  messengerUrl: null,
  githubUsername: "octocat",
  contactEmail: null,
  coverImageId: null,
  profilePicture: null,
  isHidden: false,
  hiddenReason: null,
  searchVisible: true,
};

const saved: ProjectFields[] = [
  { key: "p1", id: "p1", title: "One", description: "", demoUrl: "", sourceUrl: "" },
  { key: "p2", id: "p2", title: "Two", description: "Second", demoUrl: "https://a.example", sourceUrl: "" },
];

describe("profileFields", () => {
  it("turns nulls into empty inputs and the course id into select text", () => {
    expect(profileFields(profile)).toEqual({
      displayName: "Juan Cruz",
      tagline: "",
      courseId: "3",
      messengerUrl: "",
      githubUsername: "octocat",
      contactEmail: "",
      searchVisible: true,
    });
  });
});

describe("projectFields", () => {
  it("keys saved projects by id", () => {
    const [first] = projectFields([
      { id: "p1", title: "One", description: "", demoUrl: null, sourceUrl: "https://s.example", sortOrder: 0, images: [] },
    ]);
    expect(first).toEqual({ key: "p1", id: "p1", title: "One", description: "", demoUrl: "", sourceUrl: "https://s.example" });
  });
});

describe("changedProfileFields", () => {
  it("returns only what changed, including a cleared field", () => {
    const before = profileFields(profile);
    const after: ProfileFields = { ...before, tagline: "Builds things", githubUsername: "", searchVisible: false };
    expect(changedProfileFields(before, after)).toEqual({
      tagline: "Builds things",
      githubUsername: "",
      searchVisible: false,
    });
    expect(changedProfileFields(before, { ...before })).toEqual({});
  });
});

describe("planProjectSaves", () => {
  it("creates new projects, updates changed fields, and removes dropped ones", () => {
    const draft: ProjectFields[] = [
      { ...saved[1]!, title: "Two, renamed" },
      { key: "new-1", id: null, title: "Three", description: "", demoUrl: "", sourceUrl: "" },
    ];
    expect(planProjectSaves(saved, draft)).toEqual({
      create: [{ key: "new-1", input: { title: "Three", description: "", demoUrl: "", sourceUrl: "" } }],
      update: [{ key: "p2", id: "p2", input: { title: "Two, renamed" } }],
      remove: ["p1"],
    });
  });

  it("plans nothing when the projects are unchanged", () => {
    const plan = planProjectSaves(saved, saved.map((p) => ({ ...p })));
    expect(plan).toEqual({ create: [], update: [], remove: [] });
    expect(hasChanges({}, plan)).toBe(false);
    expect(hasChanges({ tagline: "x" }, plan)).toBe(true);
  });
});
