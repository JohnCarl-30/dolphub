import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

// Posts come from e2e/seed-auth.ts: an open internship and event, a closed program, and a hidden internship.

test.describe("opportunities list", () => {
  test("shows open posts with counted kind filters, hiding closed and hidden ones", async ({ page }) => {
    await page.goto("/opportunities");
    await expect(page.getByRole("heading", { level: 1, name: "Opportunities" })).toBeVisible();

    const list = page.getByRole("list", { name: "Open opportunities" });
    await expect(list.getByRole("heading", { name: "Software engineering intern" })).toBeVisible();
    await expect(list.getByRole("heading", { name: "Cloud hack day" })).toBeVisible();
    await expect(page.getByText("Closed scholarship")).toHaveCount(0);
    await expect(page.getByText("Hidden internship")).toHaveCount(0);

    const filter = page.getByRole("navigation", { name: "Filter by kind" });
    await expect(filter.getByRole("link", { name: /^All \[/ })).toHaveAttribute("aria-current", "page");
    await expect(filter.getByRole("link", { name: /^Internships \[1\]$/ })).toBeVisible();
    await expect(filter.getByRole("link", { name: /^Programs \[0\]$/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("filters by kind through the address", async ({ page }) => {
    await page.goto("/opportunities");
    await page.getByRole("navigation", { name: "Filter by kind" }).getByRole("link", { name: /^Events \[/ }).click();
    await expect(page).toHaveURL(/\?kind=event$/);
    const list = page.getByRole("list", { name: "Open events" });
    await expect(list.getByRole("listitem")).toHaveCount(1);
    await expect(list).toContainText("Cloud hack day");
    await expect(page.getByRole("link", { name: /^Events \[/ })).toHaveAttribute("aria-current", "page");
  });

  test("explains an empty kind", async ({ page }) => {
    await page.goto("/opportunities?kind=program");
    await expect(page.getByRole("main").getByText("No open programs right now")).toBeVisible();
  });

  test("cards open the post's own page", async ({ page }) => {
    await page.goto("/opportunities");
    await page.getByRole("link", { name: /Software engineering intern/ }).click();
    await expect(page).toHaveURL(/\/opportunities\/e2e-software-intern-a1b2$/);
    await expect(page.getByRole("heading", { level: 1, name: "Software engineering intern" })).toBeVisible();
  });
});

test.describe("opportunity page", () => {
  test("shows details and an apply link that opens the organization's page", async ({ page }) => {
    await page.goto("/opportunities/e2e-software-intern-a1b2");
    await expect(page.getByRole("main").getByText("Internship · Acme Labs")).toBeVisible();
    await expect(page.getByRole("main").getByText("On site, Makati")).toBeVisible();
    const apply = page.getByRole("link", { name: /^Apply/ });
    await expect(apply).toHaveAttribute("href", "https://example.com/acme-intern");
    await expect(apply).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("link", { name: "Report a problem with this post" })).toHaveAttribute("href", /^mailto:/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
  });

  test("events say Register", async ({ page }) => {
    await page.goto("/opportunities/e2e-cloud-hack-day-c3d4");
    await expect(page.getByRole("link", { name: /^Register/ })).toHaveAttribute("href", "https://example.com/cloud-hack-day");
  });

  test("a closed post stays reachable, says so, and is kept out of search", async ({ page }) => {
    await page.goto("/opportunities/e2e-closed-scholarship-e5f6");
    await expect(page.getByRole("main").getByText("This opportunity has closed")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Apply/ })).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  // The page shell streams before the post loads, so the status stays 200. The content and noindex are what matter.
  test("hidden and unknown posts are not found and kept out of search", async ({ page }) => {
    for (const slug of ["e2e-hidden-intern-0a0b", "no-such-post"]) {
      await page.goto(`/opportunities/${slug}`);
      await expect(page.getByRole("heading", { name: "This page could not be found." })).toBeVisible();
      await expect(page.getByText("Hidden internship")).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    }
  });
});
