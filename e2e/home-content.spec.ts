import { expect, test } from "@playwright/test";

test.describe("upcoming strip", () => {
  test("shows the next three open posts with closing labels, soonest first", async ({ page }) => {
    await page.goto("/");
    const strip = page.getByRole("region", { name: "Upcoming" });
    const cards = strip.getByRole("listitem");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText("Closes today");
    await expect(cards.nth(1)).toContainText("Closes tomorrow");
    await expect(strip).not.toContainText("UI design jam"); // the closed sample post
    const link = cards.nth(0).getByRole("link");
    await expect(link).toHaveAttribute("href", /^https:\/\//);
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("explains itself when nothing is open", async ({ page }) => {
    await page.goto("/?mock=empty");
    const strip = page.getByRole("region", { name: "Upcoming" });
    await expect(strip.getByText("Nothing open right now")).toBeVisible();
    await expect(page.getByRole("complementary")).toHaveCount(0);
  });
});

test.describe("focus band", () => {
  test("puts the post closing soonest above the showcase", async ({ page }) => {
    await page.goto("/");
    const band = page.getByRole("complementary", { name: /Hack Night/ });
    await expect(band).toContainText("Closes today");
    await expect(band.getByRole("link", { name: /Register/ })).toHaveAttribute("href", /^https:\/\//);
  });

  test("stays away when nothing closes within three days", async ({ page }) => {
    await page.goto("/?mock=calm");
    await expect(page.getByRole("region", { name: "Upcoming" }).getByRole("listitem")).toHaveCount(3);
    await expect(page.getByRole("complementary")).toHaveCount(0);
  });
});

test.describe("newsletter signup", () => {
  test("validates, confirms, remembers in the tab, and resets", async ({ page }) => {
    await page.goto("/");
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

    await page.reload();
    await expect(section.getByRole("status")).toContainText("mira.s@example.com");
    await section.getByRole("button", { name: "Use a different email" }).click();
    await expect(section.getByRole("textbox", { name: "Email" })).toBeVisible();
  });
});
