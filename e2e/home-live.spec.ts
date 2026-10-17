import { expect, test } from "@playwright/test";

test.describe("the live things on the home page", () => {
  test("typing a handle tells you whether the link is free, taken, or malformed", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", { name: /Your page will live at/ });
    const submit = page.getByRole("button", { name: "claim it" });
    const status = page.locator("section:has(form[action='/dashboard']) [aria-live='polite']");
    await expect(submit).toBeDisabled();
    await input.fill("mira");
    await expect(status).toContainText("already Mira Santos's page");
    await expect(status.getByRole("link", { name: "Open it" })).toHaveAttribute("href", "/u/mira");
    await expect(submit).toBeDisabled();
    await input.fill("x");
    await expect(status).toContainText("Two to thirty");
    await input.fill("New-Handle");
    await expect(status).toContainText("dolphub.tech/u/new-handle is free");
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page).toHaveURL(/\/dashboard\?handle=New-Handle/);
    await expect(page.getByRole("textbox", { name: "Handle" })).toHaveValue("new-handle");
  });

  test("the publishing stages follow the slider and the keyboard", async ({ page }) => {
    await page.goto("/");
    const range = page.getByRole("slider", { name: "Publishing stage" });
    await expect(page.getByRole("heading", { name: "First, sign in with your PCU address." })).toBeVisible();
    await range.fill("1");
    await expect(page.getByRole("heading", { name: "Then add one project with a title." })).toBeVisible();
    await expect(range).toHaveAttribute("aria-valuetext", "Add a project");
    await range.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { name: "Last, share your one link anywhere." })).toBeVisible();
    await expect(page.locator("[data-ui]").filter({ hasText: "dolphub.tech/u/mira" })).toBeVisible();
  });

  test("every picture is a real one with a credit", async ({ page }) => {
    await page.goto("/");
    // Next.js serves them through its image route, so match the folder name, not the path.
    const pictures = page.locator("img[src*='world']");
    expect(await pictures.count()).toBeGreaterThanOrEqual(4);
    await expect(page.getByText(/Wikimedia Commons/).first()).toBeVisible();
  });
});
