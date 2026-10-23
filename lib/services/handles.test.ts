import { describe, expect, it } from "vitest";
import { suggestHandle, validateHandle } from "./handles";

describe("validateHandle", () => {
  it("accepts and lowercases valid handles", () => {
    expect(validateHandle("  Juan_Dela-Cruz ")).toBe("juan_dela-cruz");
    expect(validateHandle("abc")).toBe("abc");
  });

  it.each(["ab", "-juan", "juan-", "juan cruz", "juan.cruz", "a".repeat(31), "ñino"])(
    "rejects badly formed %s",
    (h) => expect(() => validateHandle(h)).toThrow(/3 to 30 lowercase letters/),
  );

  it.each(["admin", "API", "login", "pcu", "pcu-official", "pcuteam", "the-admin", "official-juan"])(
    "rejects reserved %s",
    (h) => expect(() => validateHandle(h)).toThrow(/reserved/),
  );
});

describe("suggestHandle", () => {
  it.each([
    ["Juan Dela Cruz", "juan-dela-cruz"],
    ["  Ñiño Santos ", "nino-santos"],
    ["juan.cruz@pcu.edu.ph", "juan-cruz-pcu-edu-ph"],
    ["-juan_", "juan"],
    ["a".repeat(29) + " b", "a".repeat(29)],
  ])("turns %s into %s", (raw, expected) => expect(suggestHandle(raw)).toBe(expected));

  it.each(["ab", "!!", "", "Admin", "PCU Team"])("has nothing to offer for %s", (raw) =>
    expect(suggestHandle(raw)).toBeNull(),
  );
});
