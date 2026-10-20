import { describe, expect, it } from "vitest";
import { TECH_COURSES } from "./db/seed-data";
import { courseLabel } from "./course-labels";

describe("courseLabel", () => {
  it("shortens the seeded programs", () => {
    expect(TECH_COURSES.map(courseLabel)).toEqual(["Computer Engineering", "CS", "IT"]);
  });

  it("drops the BS prefix from programs added later", () => {
    expect(courseLabel("BS Information Systems")).toBe("Information Systems");
    expect(courseLabel("Associate in Computer Technology")).toBe("Associate in Computer Technology");
  });
});
