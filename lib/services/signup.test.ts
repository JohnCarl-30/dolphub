import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, PCU_DOMAINS, type TestEnv } from "../test/helpers";
import { isAllowedSignupEmail, signInOrRegister } from "./signup";
import { writeSignupsFrozen } from "./settings";

describe("isAllowedSignupEmail", () => {
  it("matches the domain exactly", () => {
    expect(isAllowedSignupEmail("Juan@PCU.edu.ph", PCU_DOMAINS)).toBe(true);
    expect(isAllowedSignupEmail("juan@gmail.com", PCU_DOMAINS)).toBe(false);
    expect(isAllowedSignupEmail("juan@evilpcu.edu.ph", PCU_DOMAINS)).toBe(false);
    expect(isAllowedSignupEmail("juan@pcu.edu.ph.evil.com", PCU_DOMAINS)).toBe(false);
    expect(isAllowedSignupEmail("pcu.edu.ph", PCU_DOMAINS)).toBe(false);
  });
});

describe("signInOrRegister", () => {
  let env: TestEnv;
  beforeEach(async () => {
    env = await createTestContext();
  });

  it("creates a new user once, with a normalized email", async () => {
    const first = await signInOrRegister(env.db, " Juan@PCU.edu.ph ", PCU_DOMAINS);
    const again = await signInOrRegister(env.db, "juan@pcu.edu.ph", PCU_DOMAINS);
    expect(first).toMatchObject({ email: "juan@pcu.edu.ph", isNew: true });
    expect(again).toMatchObject({ id: first.id, isNew: false });
  });

  it("rejects non-PCU addresses", async () => {
    await expect(signInOrRegister(env.db, "x@gmail.com", PCU_DOMAINS)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("blocks new signups when frozen but lets existing users in", async () => {
    const existing = await signInOrRegister(env.db, "old@pcu.edu.ph", PCU_DOMAINS);
    await writeSignupsFrozen(env.db, true);
    await expect(signInOrRegister(env.db, "new@pcu.edu.ph", PCU_DOMAINS)).rejects.toMatchObject({
      code: "SIGNUPS_FROZEN",
    });
    await expect(signInOrRegister(env.db, "old@pcu.edu.ph", PCU_DOMAINS)).resolves.toMatchObject({
      id: existing.id,
    });
  });
});
