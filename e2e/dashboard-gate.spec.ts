import { expect, test } from "@playwright/test";
import { authenticate } from "./helpers";

test.describe("dashboard sign-in landing", () => {
  test("signed-out visitors get the landing, not a redirect", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your page starts here");
    const google = page.getByRole("link", { name: "Continue with Google" });
    await expect(google).toHaveAttribute("href", "/auth/google");
    await expect(google).toHaveAccessibleDescription(/@pcu\.edu\.ph/);
    await expect(page.getByRole("link", { name: "Get a sign-in link by email instead" })).toHaveAttribute(
      "href",
      "/login",
    );
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  });

  test("without a Google OAuth client, the button comes back and points to email", async ({ page }) => {
    // The browser-test server sets no GOOGLE_CLIENT_ID, so the route reports it as unavailable.
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Continue with Google" }).click();
    await expect(page).toHaveURL(/\/dashboard\?signin=unavailable$/);
    await expect(page.getByRole("main").getByRole("alert")).toContainText("by email instead");
  });

  test("a callback without a started sign-in is turned away", async ({ page }) => {
    await page.goto("/auth/google/callback?code=forged&state=forged");
    await expect(page).toHaveURL(/\/dashboard\?signin=/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your page starts here");
  });

  test("explains why a Google sign-in came back without a session", async ({ page }) => {
    const reasons = {
      cancelled: "was cancelled",
      expired: "took too long",
      "not-pcu": "not a PCU address",
      frozen: "signups are paused",
      unavailable: "by email instead",
      nonsense: "did not finish",
    };
    for (const [reason, text] of Object.entries(reasons)) {
      await page.goto(`/dashboard?signin=${reason}`);
      await expect(page.getByRole("main").getByRole("alert")).toContainText(text);
    }
  });

  test("signed-in students skip the landing and see their dashboard", async ({ page }) => {
    await authenticate(page);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Your page starts here" })).toHaveCount(0);
    await expect(page.getByTestId("identity-rail")).toBeVisible();
  });
});
