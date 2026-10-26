import { expect, test } from "@playwright/test";
import { authenticate } from "./helpers";

test.beforeEach(async ({ page }) => authenticate(page));

// Posts come from e2e/seed-auth.ts. The admin tests may add a competition closing in 12 days while these run.

test.describe("upcoming strip", () => {
  test("shows the next three open posts from the database, soonest closing first", async ({ page }) => {
    await page.goto("/home");
    const strip = page.getByRole("region", { name: "Upcoming" });
    const cards = strip.getByRole("listitem");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText("Team capture-the-flag");
    await expect(cards.nth(0)).toContainText("Closes tomorrow");
    await expect(cards.nth(1)).toContainText("Cloud hack day");
    await expect(cards.nth(1)).toContainText(/Closes in \d days/);
    await expect(strip).not.toContainText("Closed scholarship");
    await expect(strip).not.toContainText("Hidden internship");
    // Cards open the post's page. The apply link there needs sign-in, so it is never on the home page.
    const link = cards.nth(0).getByRole("link");
    await expect(link).toHaveAttribute("href", "/opportunities/e2e-team-ctf-f7g8");
    expect(await page.content()).not.toContain("example.com/team-ctf");
  });
});

test.describe("focus band", () => {
  test("puts the post closing within three days above the showcase", async ({ page }) => {
    await page.goto("/home");
    const band = page.getByRole("complementary", { name: "Team capture-the-flag" });
    await expect(band).toContainText("Closes tomorrow");
    await expect(band.getByRole("link", { name: /Register/ })).toHaveAttribute("href", "/opportunities/e2e-team-ctf-f7g8");
  });
});

test.describe("newsletter signup", () => {
  test("validates, saves to the account, survives a reload, and unsubscribes", async ({ page }, testInfo) => {
    // Its own account per project, so desktop and phone runs never share a subscription.
    await authenticate(page, `newcomer-${testInfo.project.name}`);
    await page.goto("/home");
    const section = page.getByRole("region", { name: "Get new posts by email" });
    const email = section.getByRole("textbox", { name: "Email" });
    const submit = section.getByRole("button", { name: "Sign up" });

    await email.fill("not-an-email");
    await submit.click();
    await expect(section.getByRole("alert")).toContainText("valid email");
    await expect(email).toHaveAttribute("aria-invalid", "true");

    for (const name of ["Internships", "Events"]) await section.getByRole("button", { name }).click();
    await email.fill("Mira.S@Example.com");
    await submit.click();
    await expect(section.getByRole("alert")).toContainText("at least one");

    await section.getByRole("button", { name: "Competitions" }).click();
    await submit.click();
    const status = section.getByRole("status");
    await expect(status).toContainText("mira.s@example.com");
    await expect(status).toContainText("competitions");

    // Stored on the server now, not in the tab.
    await page.reload();
    await expect(section.getByRole("status")).toContainText("mira.s@example.com");

    await section.getByRole("button", { name: "Change email or topics" }).click();
    await expect(email).toHaveValue("mira.s@example.com");
    await expect(section.getByRole("button", { name: "Competitions" })).toHaveAttribute("aria-pressed", "true");
    await section.getByRole("button", { name: "Programs" }).click();
    await submit.click();
    await expect(status).toContainText("competitions, programs");

    await section.getByRole("button", { name: "Unsubscribe" }).click();
    await expect(submit).toBeVisible();
    await page.reload();
    await expect(section.getByRole("button", { name: "Sign up" })).toBeVisible();
  });
});
