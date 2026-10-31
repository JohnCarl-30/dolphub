import { describe, expect, it } from "vitest";
import { initialsFor } from "./profile-avatar";

describe("initialsFor", () => {
  it("takes the first letter of up to two words", () => {
    expect(initialsFor("Mira Santos")).toBe("MS");
    expect(initialsFor("feed-test")).toBe("FT");
    expect(initialsFor("OrgFair")).toBe("O");
  });

  it("skips symbols between words", () => {
    expect(initialsFor("Lost & Found locker")).toBe("LF");
  });
});
