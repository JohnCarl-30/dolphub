import { describe, expect, it } from "vitest";
import { classifyViewSource } from "./analytics";

describe("analytics source classification", () => {
  it("accepts known internal source tags", () => {
    expect(classifyViewSource("share", null, "https://dolphub.tech")).toBe("share");
    expect(classifyViewSource("showcase", null, "https://dolphub.tech")).toBe("showcase");
  });
  it("classifies missing, same-origin, and external referrers", () => {
    expect(classifyViewSource(null, null, "https://dolphub.tech")).toBe("direct");
    expect(classifyViewSource(null, "https://dolphub.tech/home", "https://dolphub.tech")).toBe("direct");
    expect(classifyViewSource(null, "https://google.com", "https://dolphub.tech")).toBe("external");
  });
});
