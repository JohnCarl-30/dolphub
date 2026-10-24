import { expect, test } from "@playwright/test";
import { authenticate } from "./helpers";

test("the public landing is the same for signed-out and signed-in visitors", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "One link for every project you've built." })).toBeVisible();
  for (const heading of ["What is Dolphub?", "About Dolphub", "Vision of Dolphub", "Featured students"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Create your page →" })).toHaveAttribute("href", "/dashboard");
  await expect(page.getByRole("link", { name: "Log in →" })).toHaveAttribute("href", "/login");
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
  const canonicalUrl = new URL((await canonical.getAttribute("href"))!);
  expect(canonicalUrl.pathname).toBe("/");

  await authenticate(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "One link for every project you've built." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create your page →" })).toHaveAttribute("href", "/dashboard");
});

test("the showcase requires sign-in and stays noindex without a robots block", async ({ page, request }) => {
  await page.goto("/home");
  await expect(page).toHaveURL((url) => url.pathname === "/dashboard" && url.searchParams.get("next") === "/home");

  await authenticate(page);
  await page.goto("/home");
  const robots = await page.locator('meta[name="robots"]').evaluateAll((tags) => tags.map((tag) => tag.getAttribute("content")));
  expect(robots.some((content) => content?.includes("noindex") && content.includes("nofollow"))).toBe(true);

  const robotsText = await (await request.get("/robots.txt")).text();
  expect(robotsText).not.toMatch(/^Disallow: \/home$/m);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("https://dolphub.tech/");
  expect(sitemap).not.toContain("https://dolphub.tech/home");
});
