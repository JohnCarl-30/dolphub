import { describe, expect, it } from "vitest";
import {
  EDITABLE_HANDLE,
  INITIAL_PROFILES,
  getPublicProfile,
  listGridProfiles,
  upsertProfile,
} from "./mock-profiles";

describe("listGridProfiles", () => {
  it("hides students who have no project", () => {
    const handles = listGridProfiles(INITIAL_PROFILES).map((profile) => profile.handle);
    expect(handles).toEqual(["mira", "kenji", "aisha", "paolo"]);
    expect(handles).not.toContain("lea");
  });

  it("filters by course", () => {
    expect(listGridProfiles(INITIAL_PROFILES, "cs").map((profile) => profile.handle)).toEqual([
      "aisha",
    ]);
  });

  it("returns an empty list when a course has no published pages", () => {
    const onlyLea = INITIAL_PROFILES.filter((profile) => profile.handle === "lea");
    expect(listGridProfiles(onlyLea, "cs")).toEqual([]);
  });
});

describe("getPublicProfile", () => {
  it("finds a handle without caring about case", () => {
    expect(getPublicProfile(INITIAL_PROFILES, "MIRA")?.displayName).toBe("Mira Santos");
  });

  it("returns null for an unknown handle", () => {
    expect(getPublicProfile(INITIAL_PROFILES, "nobody")).toBeNull();
  });
});

describe("upsertProfile", () => {
  it("replaces the editable student so the grid and profile stay in sync", () => {
    const edited = {
      ...INITIAL_PROFILES[0],
      displayName: "Mira S.",
      tagline: "Edited in the dashboard",
    };
    const next = upsertProfile(INITIAL_PROFILES, edited, EDITABLE_HANDLE);
    expect(getPublicProfile(next, "mira")?.tagline).toBe("Edited in the dashboard");
    expect(listGridProfiles(next)[0]?.displayName).toBe("Mira S.");
  });
});
