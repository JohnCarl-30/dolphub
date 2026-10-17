import { describe, expect, it, vi } from "vitest";
import { ServiceError } from "../services/errors";
import { ok, toActionError } from "./result";

describe("action results", () => {
  it("wraps data", () => {
    expect(ok({ handle: "juan" })).toEqual({ ok: true, data: { handle: "juan" } });
  });

  it("passes service messages and fields through", () => {
    expect(toActionError(new ServiceError("CONFLICT", "That handle is already taken", "handle"), "x")).toEqual({
      ok: false,
      error: "That handle is already taken",
      field: "handle",
    });
    expect(toActionError(new ServiceError("FORBIDDEN", "Admins only"), "x")).toEqual({
      ok: false,
      error: "Admins only",
    });
  });

  it("hides unexpected errors from the user and logs them", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(toActionError(new Error("connection refused at 10.0.0.5"), "Save profile")).toEqual({
      ok: false,
      error: "Something went wrong. Please try again.",
    });
    expect(log).toHaveBeenCalledWith(
      "Save profile failed",
      expect.objectContaining({ name: "Error", message: "connection refused at 10.0.0.5" }),
    );
    log.mockRestore();
  });
});
