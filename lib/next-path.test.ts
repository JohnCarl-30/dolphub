import { describe, expect, it } from "vitest";
import { safeNextPath, withNext } from "./next-path";

describe("safeNextPath", () => {
  it.each(["/opportunities/acme-intern-a1b2", "/dashboard", "/"])("allows %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    ["another site", "https://evil.example/"],
    ["a protocol-relative URL", "//evil.example"],
    ["a backslash trick", "/\\evil.example"],
    ["a relative path", "opportunities"],
    ["a query string", "/login?next=//evil.example"],
    ["a script URL", "javascript:alert(1)"],
    ["something too long", `/${"a".repeat(200)}`],
    ["a non-string", ["/dashboard"]],
    ["nothing", undefined],
  ])("refuses %s", (_name, raw) => {
    expect(safeNextPath(raw)).toBeNull();
  });
});

describe("withNext", () => {
  it("adds the path as a query parameter", () => {
    expect(withNext("/login", "/opportunities/x")).toBe("/login?next=%2Fopportunities%2Fx");
    expect(withNext("/dashboard?signin=expired", "/opportunities/x")).toBe(
      "/dashboard?signin=expired&next=%2Fopportunities%2Fx",
    );
  });

  it("leaves the URL alone with nowhere to return to", () => {
    expect(withNext("/login", null)).toBe("/login");
  });
});
