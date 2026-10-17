import { expect, test } from "@playwright/test";
import { scaleOf, whilePressed } from "./helpers";

test.describe("motion tokens", () => {
  test("the root exposes strong easing curves", async ({ page }) => {
    await page.goto("/");
    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        easeOut: style.getPropertyValue("--ease-out").trim(),
        easeInOut: style.getPropertyValue("--ease-in-out").trim(),
      };
    });
    // Browsers may print 0.23 as .23; compare the numbers, not the text.
    const numbers = (value: string) => value.match(/[\d.]+/g)?.map(Number);
    expect(numbers(tokens.easeOut)).toEqual([0.23, 1, 0.32, 1]);
    expect(numbers(tokens.easeInOut)).toEqual([0.77, 0, 0.175, 1]);
  });
});

test.describe("hero", () => {
  test("each authored line rises from behind its baseline, then the copy fades in", async ({ page }) => {
    await page.goto("/");
    const lines = page.locator("h1 [data-line]");
    await expect(lines).toHaveCount(2);
    const delays = await lines.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).animationDelay),
    );
    expect(delays).toEqual(["0.15s", "0.26s"]);
    const names = await lines.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).animationName),
    );
    expect(new Set(names)).toEqual(new Set(["line-up"]));
    const after = page.locator("[data-after-lines]");
    await expect(after).toHaveCount(2);
    // Once settled, everything sits where static content would and is fully visible.
    await expect(async () => {
      for (const part of [...(await lines.all()), ...(await after.all())]) {
        expect(await part.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
        expect(await part.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
      }
    }).toPass();
  });

  test("the slot in the sentence is a real student link that takes turns", async ({ page }) => {
    await page.goto("/");
    const slot = page.locator("h1 .slot a");
    await expect(slot).toHaveAttribute("href", /^\/u\/[a-z0-9-]+$/);
    const first = await slot.getAttribute("href");
    await expect(slot).not.toHaveAttribute("href", first!, { timeout: 6000 });
  });
});

test.describe("press feedback", () => {
  test("a filter word scales down while pressed and recovers on release", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /^CS/ });
    await expect(button).toBeVisible();
    expect(await scaleOf(button)).toBe(1);
    await whilePressed(page, button, async () => {
      await expect.poll(() => scaleOf(button)).toBeCloseTo(0.97, 2);
    });
    await expect.poll(() => scaleOf(button)).toBe(1);
  });

  test("the press transition only touches transform and colors", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /^Everyone/ });
    const properties = await button.evaluate((element) => getComputedStyle(element).transitionProperty);
    expect(properties).not.toContain("all");
    expect(properties).toContain("transform");
  });
});

test.describe("filter results", () => {
  test("a new result set rises in again with a per-card stagger", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^IT/ }).click();
    const cards = page.locator("[data-showcase-card]");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    const delays = await cards.evaluateAll((elements) =>
      elements.map((element) => parseFloat(getComputedStyle(element).animationDelay)),
    );
    for (let index = 1; index < delays.length; index++) {
      expect(delays[index]).toBeGreaterThanOrEqual(delays[index - 1]);
    }
    expect(Math.max(...delays)).toBeLessThanOrEqual(0.4);
  });
});

test.describe("scroll reveal", () => {
  test("sections below the fold arrive once they are in view, and stay", async ({ page }) => {
    await page.goto("/");
    const figures = page.locator("#figures-heading + p");
    await expect(page.locator("[data-reveal-ready]")).toHaveCount(1);
    await figures.scrollIntoViewIfNeeded();
    await expect(figures).toHaveClass(/is-in/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(figures).toHaveClass(/is-in/);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the headline does not animate, the slot holds still, the showcase is a plain list", async ({ page }) => {
    await page.goto("/");
    const line = page.locator("h1 [data-line]").first();
    expect(await line.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
    const slot = page.locator("h1 .slot a");
    const first = await slot.getAttribute("href");
    await page.waitForTimeout(3200);
    await expect(slot).toHaveAttribute("href", first!);
    await expect(page.getByText("List view, reduced motion")).toBeVisible();
    await expect(page.locator(".showcase")).toHaveAttribute("data-layout", "list");
    await expect(page.locator(".home-network canvas")).toHaveCount(0);
  });

  test("a pressed button does not move", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /^CS/ });
    await whilePressed(page, button, async () => {
      await page.waitForTimeout(250);
      expect(await scaleOf(button)).toBe(1);
    });
  });
});
