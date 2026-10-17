import { describe, expect, it } from "vitest";
import { validateHandle } from "./handles";

describe("validateHandle", () => {
  it("accepts and lowercases valid handles", () => {
    expect(validateHandle("  Juan_Dela-Cruz ")).toBe("juan_dela-cruz");
    expect(validateHandle("abc")).toBe("abc");
  });

  it.each(["ab", "-juan", "juan-", "juan cruz", "juan.cruz", "a".repeat(31), "ñino"])(
    "rejects badly formed %s",
    (h) => expect(() => validateHandle(h)).toThrow(/3 to 30 characters/),
  );

  it.each(["admin", "API", "login", "pcu", "pcu-official", "pcuteam", "the-admin", "official-juan"])(
    "rejects reserved %s",
    (h) => expect(() => validateHandle(h)).toThrow(/reserved/),
  );
});
