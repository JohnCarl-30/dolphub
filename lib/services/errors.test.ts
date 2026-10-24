import { describe, expect, it } from "vitest";
import { isMissingRelation } from "./errors";

describe("isMissingRelation", () => {
  it("recognizes the expected PostgreSQL relation error through wrappers", () => {
    expect(isMissingRelation({ cause: { code: "42P01", message: 'relation "project_stars" does not exist' } }, "project_stars")).toBe(true);
  });

  it("does not hide other missing relations or database errors", () => {
    expect(isMissingRelation({ code: "42P01", message: 'relation "users" does not exist' }, "project_stars")).toBe(false);
    expect(isMissingRelation({ code: "08006", message: 'relation "project_stars" does not exist' }, "project_stars")).toBe(false);
  });
});
