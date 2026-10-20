import { expect, test } from "@playwright/test";
import { authenticate, expectNoHorizontalOverflow } from "./helpers";

// The admin, its session and one student page per project come from e2e/seed-auth.ts.
// Desktop and phone run at the same time against one database, so each run
// works on its own page and its own post, and only the phone run touches signups.

const DAY_MS = 24 * 60 * 60 * 1000;

/** "2026-10-30", Philippine time, some days from now. */
function manilaDate(days: number): string {
  return new Date(Date.now() + 8 * 60 * 60 * 1000 + days * DAY_MS).toISOString().slice(0, 10);
}

test.describe("admin access", () => {
  test("sends signed-out visitors to sign in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows students who are not admins the ordinary not-found page", async ({ page }) => {
    await authenticate(page);
    for (const path of ["/admin", "/admin/opportunities", "/admin/opportunities/new"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: "Admin" })).toHaveCount(0);
    }
  });
});

test.describe("admin overview", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page, "admin");
  });

  test("shows the numbers and the opportunities launch check", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Admin" })).toBeVisible();
    const stats = page.getByRole("region", { name: "Numbers" });
    await expect(stats.getByText("Active pages")).toBeVisible();
    await expect(stats.getByText(/^\d+ \/ 50$/)).toBeVisible();
    const launch = page.getByRole("region", { name: "Opportunities for launch" });
    await expect(launch.getByText("10 or more open posts")).toBeVisible();
    await expect(launch.getByText("3 or more kinds")).toBeVisible();
    await expect(page.getByRole("link", { name: "[ A1 ] Overview" })).toHaveAttribute("aria-current", "page");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expectNoHorizontalOverflow(page);
  });

  test("hides a student page with a reason, then restores it", async ({ page }, testInfo) => {
    const handle = `e2e-hide-${testInfo.project.name}`;
    await page.goto("/admin");
    const row = page.getByRole("article", { name: `/u/${handle}` });
    await row.getByRole("button", { name: `Hide /u/${handle}` }).click();
    await expect(row.getByLabel("Why hide this page?")).toBeFocused();
    await row.getByLabel("Why hide this page?").fill("Test takedown");
    await row.getByRole("button", { name: "Hide page" }).click();
    await expect(row.getByText("Reason: Test takedown")).toBeVisible();
    await expect(row.getByText("Hidden", { exact: true })).toBeVisible();

    await page.getByRole("navigation", { name: "Which pages" }).getByRole("link", { name: /^Hidden/ }).click();
    await expect(page).toHaveURL(/\?show=hidden$/);
    const hiddenRow = page.getByRole("article", { name: `/u/${handle}` });
    await hiddenRow.getByRole("button", { name: `Restore /u/${handle}` }).click();
    await expect(hiddenRow).toHaveCount(0);

    await page.goto("/admin");
    await expect(page.getByRole("article", { name: `/u/${handle}` }).getByText("Visible", { exact: true })).toBeVisible();
  });

  test("pauses and resumes signups", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "phone", "Signups are site-wide, so one project covers it, from a phone");
    await page.goto("/admin");
    const signups = page.getByRole("region", { name: "Signups" });
    await expect(signups.getByText("Signups are open")).toBeVisible();
    await signups.getByLabel("Reason, optional").fill("Browser test");
    await signups.getByRole("button", { name: "Pause signups" }).click();
    await expect(signups.getByText("Signups are paused")).toBeVisible();
    await signups.getByRole("button", { name: "Resume signups" }).click();
    await expect(signups.getByText("Signups are open")).toBeVisible();
  });
});

test.describe("admin opportunities", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page, "admin");
  });

  test("lists posts as open, hidden and closed", async ({ page }) => {
    await page.goto("/admin/opportunities");
    await expect(page.getByRole("region", { name: /^Open/ }).getByRole("article", { name: "Cloud hack day" })).toBeVisible();
    await expect(page.getByRole("region", { name: /^Hidden/ }).getByRole("article", { name: "Hidden internship" })).toBeVisible();
    await expect(page.getByRole("region", { name: /^Closed/ }).getByRole("article", { name: "Closed scholarship" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("explains a missing date and focuses it", async ({ page }) => {
    await page.goto("/admin/opportunities/new");
    await page.getByLabel("Kind").selectOption("event");
    await page.getByLabel("Title").fill("Date check");
    await page.getByLabel("Organization").fill("Example Org");
    await page.getByLabel("Summary").fill("Checks the date rules.");
    await page.getByLabel("Link to apply or register").fill("https://example.com/date-check");
    await page.getByRole("button", { name: "Post it" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Add when the event starts");
    await expect(page.getByLabel("Starts")).toBeFocused();
  });

  // Competitions, because the public list tests count internships, events and programs.
  test("posts, edits, hides and deletes a post", async ({ page }, testInfo) => {
    const title = `Admin test hackathon ${testInfo.project.name}`;
    const renamed = `${title} renamed`;

    await page.goto("/admin/opportunities/new");
    await page.getByLabel("Kind").selectOption("competition");
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Organization").fill("Example Org");
    await page.getByLabel("Summary").fill("A weekend of building in teams.");
    await page.getByLabel("Link to apply or register").fill("https://example.com/hackathon");
    await page.getByLabel("Place, optional").fill("PCU Manila");
    await page.getByLabel("Deadline", { exact: true }).fill(manilaDate(12));

    const preview = page.getByRole("region", { name: "Preview" });
    await expect(preview.getByRole("heading", { name: title })).toBeVisible();
    await expect(preview.getByText("On site, PCU Manila")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Post it" }).click();
    await expect(page).toHaveURL(/\/admin\/opportunities\?saved=/);
    await expect(page.getByRole("main").getByRole("status")).toContainText(`Saved "${title}"`);

    const row = page.getByRole("article", { name: title });
    await row.getByRole("link", { name: `Edit ${title}` }).click();
    await expect(page.getByLabel("Deadline", { exact: true })).toHaveValue(manilaDate(12));
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("main").getByRole("status")).toHaveText("Nothing has changed yet.");
    await page.getByLabel("Title").fill(renamed);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("main").getByRole("status")).toContainText(`Saved "${renamed}"`);

    await page.getByRole("main").getByRole("status").getByRole("link", { name: "See the public page" }).click();
    await expect(page.getByRole("heading", { level: 1, name: renamed })).toBeVisible();

    await page.goto("/admin/opportunities");
    const renamedRow = page.getByRole("article", { name: renamed });
    await renamedRow.getByRole("button", { name: `Hide ${renamed}` }).click();
    await renamedRow.getByLabel("Why hide this post?").fill("Test");
    await renamedRow.getByRole("button", { name: "Hide post" }).click();
    const hidden = page.getByRole("region", { name: /^Hidden/ }).getByRole("article", { name: renamed });
    await expect(hidden.getByText("Reason: Test")).toBeVisible();

    await hidden.getByRole("button", { name: `Delete ${renamed}` }).click();
    await hidden.getByRole("button", { name: "Delete for good" }).click();
    await expect(page.getByRole("article", { name: renamed })).toHaveCount(0);
  });
});
