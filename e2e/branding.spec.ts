import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { expectNoHorizontalOverflow, expectVisibleFocusRing } from "./helpers";

test("icon metadata and manifest point to working vector and Apple icons", async ({ page, request }) => {
  await page.goto("/");
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute("type", "image/svg+xml");
  await expect(icon).toHaveAttribute("sizes", "any");
  expect(new URL((await icon.getAttribute("href"))!, page.url()).pathname).toBe("/icon.svg");
  const apple = page.locator('link[rel="apple-touch-icon"]');
  expect(new URL((await apple.getAttribute("href"))!, page.url()).pathname).toBe("/apple-icon.png");
  await expect(apple).toHaveAttribute("sizes", "180x180");

  const manifestUrl = (await page.locator('link[rel="manifest"]').getAttribute("href"))!;
  const response = await request.get(manifestUrl);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.icons).toEqual([
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  ]);
  for (const asset of manifest.icons) {
    const result = await request.get(asset.src);
    expect(result.ok()).toBe(true);
    expect(result.headers()["content-type"]).toContain(asset.type);
    if (asset.type === "image/png") {
      const buffer = await result.body();
      expect(await sharp(buffer).metadata()).toMatchObject({ width: 180, height: 180, hasAlpha: false });
      const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
      expect([...data.subarray(0, 3)]).toEqual([255, 255, 255]);
      expect(data.includes(0)).toBe(true);
    }
  }
});

test("favicon changes color with browser theme and keeps transparent cutouts", async ({ page }) => {
  await page.goto("/icon.svg");
  for (const [colorScheme, fill] of [["light", "rgb(0, 0, 0)"], ["dark", "rgb(255, 255, 255)"]] as const) {
    await page.emulateMedia({ colorScheme });
    expect(await page.locator("svg path").evaluate((path) => getComputedStyle(path).fill)).toBe(fill);
  }
  await expect(page.locator("svg image, svg rect")).toHaveCount(0);
});

test("header logo retains its accessible home link and fits narrow screens", async ({ page }) => {
  await page.goto("/u/mira");
  const home = page.getByRole("banner").getByRole("link", { name: "Dolphub", exact: true });
  await expect(home).toHaveAttribute("href", "/");
  const logo = home.locator("img");
  await expect(logo).toHaveAttribute("alt", "");
  await expect(logo).toHaveAttribute("src", "/dolphub-logo.svg");
  await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.keyboard.press("Tab");
  await expect(home).toBeFocused();
  await expectVisibleFocusRing(home);
  await page.setViewportSize({ width: 320, height: 640 });
  await expectNoHorizontalOverflow(page);
  await expect(logo).toBeVisible();
  await home.click();
  await expect(page).toHaveURL(/\/$/);
});
