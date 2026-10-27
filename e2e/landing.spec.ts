import { expect, test } from "@playwright/test";
import { authenticate } from "./helpers";

test("the public landing is the same for signed-out and signed-in visitors", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "One link for every project you've built." })).toBeVisible();
  for (const heading of ["One link for every project you've built.", "What", "About", "Vision", "Featured projects"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  for (const destination of ["/what", "/about", "/vision"]) {
    await expect(page.locator(`[data-landing-panel] a[href="${destination}"]`)).toHaveCount(1);
  }
  await expect(page.locator("[data-landing-panel]")).toHaveCount(5);
  await expect(page.locator(".landing-journey")).toHaveAttribute("data-layout", /^(scroll|native)$/);
  await expect(page.locator("[data-landing-panel] h1, [data-landing-panel] h2")).toHaveText([
    "One link for every project you've built.",
    "What",
    "About",
    "Vision",
    "Featured projects",
  ]);
  await expect(page.getByRole("link", { name: "Create your page →" })).toHaveAttribute("href", "/dashboard");
  await expect(page.getByRole("link", { name: "Log in / Sign up →" })).toHaveAttribute("href", "/login");
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
  const canonicalUrl = new URL((await canonical.getAttribute("href"))!);
  expect(canonicalUrl.pathname).toBe("/");

  await authenticate(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "One link for every project you've built." })).toBeVisible();
  for (const heading of ["One link for every project you've built.", "What", "About", "Vision", "Featured projects"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Create your page →" })).toHaveAttribute("href", "/dashboard");
});

for (const info of [
  { path: "/what", title: "What is Dolphub?" },
  { path: "/about", title: "About Dolphub" },
  { path: "/vision", title: "Vision" },
]) {
  test(`${info.path} is public and has its own metadata`, async ({ page }) => {
    await page.goto(info.path);
    await expect(page.getByRole("heading", { level: 1, name: info.title })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${info.path}$`));
  });
}

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
  const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, location]) => new URL(location!).pathname,
  );
  expect(sitemapPaths).toContain("/");
  expect(sitemapPaths).not.toContain("/home");
});
