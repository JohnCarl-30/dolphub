import { expect, test, type Page } from "@playwright/test";
import { authenticate, scaleOf, whilePressed } from "./helpers";

test.beforeEach(async ({ page }) => authenticate(page));

test.describe("motion tokens", () => {
  test("the root exposes strong easing curves and a short default duration", async ({ page }) => {
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

test.describe("hero entrance", () => {
  test("label, heading and copy rise and un-blur with a measured stagger", async ({ page }) => {
    await page.goto("/home");
    const hero = page.locator("[data-hero]");
    const parts = hero.locator(".intro-reveal");
    await expect(parts).toHaveCount(3);
    const motion = await parts.evaluateAll((elements) => elements.map((element) => {
      const style = getComputedStyle(element);
      const effect = element.getAnimations()[0]?.effect;
      const first = effect instanceof KeyframeEffect ? effect.getKeyframes()[0] : null;
      return { delay: style.animationDelay, duration: style.animationDuration, name: style.animationName, first };
    }));
    expect(motion.map(({ delay }) => delay)).toEqual(["0s", "0.125s", "0.25s"]);
    expect(new Set(motion.map(({ duration }) => duration))).toEqual(new Set(["1.1s"]));
    expect(new Set(motion.map(({ name }) => name))).toEqual(new Set(["intro-reveal"]));
    expect(motion[0]?.first).toMatchObject({ opacity: "0", filter: "blur(8px)", transform: "translateY(30px)" });
    // Once settled, the content sits exactly where static content would.
    await expect(async () => {
      for (const part of await parts.all()) {
        expect(await part.evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
        expect(["none", "blur(0px)"]).toContain(await part.evaluate((element) => getComputedStyle(element).filter));
        expect(await scaleOf(part)).toBe(1);
      }
    }).toPass();
  });
});

test.describe("viewport reveals", () => {
  test("progressively reveals discovery sections without a hidden base style", async ({ page }) => {
    await page.goto("/about");
    const section = page.locator(".viewport-reveal").first();
    await expect(section).toBeAttached();
    const motion = await section.evaluate((element) => {
      const style = getComputedStyle(element);
      const animation = element.getAnimations()[0];
      const first = animation?.effect instanceof KeyframeEffect ? animation.effect.getKeyframes()[0] : null;
      return {
        supported: CSS.supports("animation-timeline: view()"),
        timeline: style.getPropertyValue("animation-timeline"),
        first,
        inlineOpacity: (element as HTMLElement).style.opacity,
        inlineFilter: (element as HTMLElement).style.filter,
        inlineTransform: (element as HTMLElement).style.transform,
      };
    });
    expect(motion.inlineOpacity).toBe("");
    expect(motion.inlineFilter).toBe("");
    expect(motion.inlineTransform).toBe("");
    if (motion.supported) {
      expect(motion.timeline).not.toBe("auto");
      expect(motion.first).toMatchObject({ opacity: "0", filter: "blur(6px)", transform: "translateY(24px)" });
    }
  });
});

test.describe("press feedback", () => {
  test("filter buttons scale down while pressed and recover on release", async ({ page }) => {
    await page.goto("/home");
    const button = page.getByRole("button", { name: /^CS \[/ });
    await expect(button).toBeVisible();
    expect(await scaleOf(button)).toBe(1);
    await whilePressed(page, button, async () => {
      await expect.poll(() => scaleOf(button)).toBeCloseTo(0.97, 2);
    });
    await expect.poll(() => scaleOf(button)).toBe(1);
  });

  test("the press transition only touches transform and colors", async ({ page }) => {
    await page.goto("/home");
    const button = page.getByRole("button", { name: /^All \[/ });
    const properties = await button.evaluate((element) => getComputedStyle(element).transitionProperty);
    expect(properties).not.toContain("all");
    expect(properties).toContain("transform");
  });
});

test.describe("filter results", () => {
  test("a new result set rises in again with a per-card stagger", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("button", { name: /^IT \[/ }).click();
    const cards = page.locator("[data-showcase-card]:visible");
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

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("entrances keep the fade and drop the travel; the showcase is a plain list", async ({ page }) => {
    await page.goto("/home");
    const heading = page.getByRole("heading", { level: 1 });
    const animation = await heading.evaluate((element) => {
      const style = getComputedStyle(element);
      return { name: style.animationName, delay: style.animationDelay, filter: style.filter, transform: style.transform };
    });
    expect(animation.name).toBe("fade");
    expect(animation.delay).toBe("0s");
    expect(animation.filter).toBe("none");
    expect(animation.transform).toBe("none");
    const reveal = page.locator(".viewport-reveal").first();
    await expect(reveal).toBeVisible();
    expect(await reveal.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
    await expect(page.getByText("List view · reduced motion")).toBeVisible();
    await expect(page.locator(".showcase:visible")).toHaveAttribute("data-layout", "list");
    await expect(page.locator(".home-network canvas")).toHaveCount(0);
  });

  test("a pressed button does not move", async ({ page }) => {
    await page.goto("/home");
    const button = page.getByRole("button", { name: /^CS \[/ });
    await whilePressed(page, button, async () => {
      await page.waitForTimeout(250);
      expect(await scaleOf(button)).toBe(1);
    });
  });
});

test.describe("site-wide particle network", () => {
  async function particleHost(page: import("@playwright/test").Page) {
    const host = page.locator('[data-particle-layer] [data-particle-host="true"]');
    await expect(host).toBeVisible();
    return host;
  }

  async function snapshot(host: import("@playwright/test").Locator) {
    return host.evaluate((element) => {
      const container = (element as HTMLDivElement & { __dolphubParticleContainer?: {
        animationStatus: boolean;
        pageHidden: boolean;
        particles: { count: number; get(index: number): { position: { x: number; y: number } } | undefined };
        actualOptions: { particles: { move: { enable: boolean } }; interactivity: { events: { onHover: { mode: string | string[] } } } };
      } }).__dolphubParticleContainer;
      if (!container) return null;
      const positions = Array.from({ length: container.particles.count }, (_, index) => container.particles.get(index)?.position ?? null);
      return {
        positions,
        animationStatus: container.animationStatus,
        pageHidden: container.pageHidden,
        drift: container.actualOptions.particles.move.enable,
        hover: container.actualOptions.interactivity.events.onHover.mode,
      };
    });
  }

  test("keeps the canvas click-through while window hover repulsion moves real particles", async ({ page }) => {
    test.skip(test.info().project.name === "phone", "The phone project intentionally has no fine pointer.");
    await page.goto("/home");
    const host = await particleHost(page);
    await expect.poll(() => snapshot(host)).not.toBeNull();
    expect(await page.locator("[data-particle-layer]").evaluate((element) => getComputedStyle(element).pointerEvents)).toBe("none");
    const before = await snapshot(host);
    const target = before!.positions.find(Boolean)!;
    await page.mouse.move(target.x, target.y);
    await expect.poll(async () => {
      const current = await snapshot(host);
      return current && current.positions.some((position, index) => {
        const previous = before!.positions[index];
        return position && previous && Math.hypot(position.x - previous.x, position.y - previous.y) > 1;
      });
    }).toBe(true);
    const current = await snapshot(host);
    expect(current?.hover).toBe("repulse");
  });

  test("keeps cards, filters, and navigation usable above the layer", async ({ page }) => {
    await page.goto("/home");
    const filter = page.getByRole("button", { name: /^CS \[/ });
    await filter.click();
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await page.locator('a[href="/privacy"]').last().click();
    await expect(page).toHaveURL(/\/privacy$/);
  });

  test("reuses the same canvas host across client-side routes", async ({ page }) => {
    await page.goto("/home");
    const host = await particleHost(page);
    const canvas = host.locator("canvas");
    await expect(canvas).toBeVisible();
    const handle = await canvas.elementHandle();
    await page.locator('a[href="/privacy"]').last().click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.locator('[data-particle-layer] [data-particle-host="true"]')).toHaveCount(1);
    expect(await handle!.evaluate((element) => element.isConnected && element === document.querySelector('[data-particle-host="true"] canvas'))).toBe(true);
    await expect.poll(() => page.locator(".home-network").evaluate((element) => ({
      y: (element as HTMLElement).style.getPropertyValue("--particle-depth-y"),
      scale: (element as HTMLElement).style.getPropertyValue("--particle-depth-scale"),
    }))).toEqual({ y: "", scale: "" });
    await page.locator('a[href="/home"]').first().click();
    await expect(page).toHaveURL(/\/home$/);
    expect(await handle!.evaluate((element) => element.isConnected && element === document.querySelector('[data-particle-host="true"] canvas'))).toBe(true);
  });

  test("composes discovery-page depth from native scroll", async ({ page }) => {
    await page.goto("/home");
    const layer = page.locator(".home-network");
    const values = () => layer.evaluate((element) => ({
      y: parseFloat((element as HTMLElement).style.getPropertyValue("--particle-depth-y")),
      scale: parseFloat((element as HTMLElement).style.getPropertyValue("--particle-depth-scale")),
    }));
    await expect.poll(values).toMatchObject({ scale: 1 });
    const before = await values();
    await page.evaluate(() => window.scrollTo({ top: Math.min(1200, document.documentElement.scrollHeight - innerHeight), behavior: "instant" }));
    await expect.poll(values).not.toEqual(before);
    const after = await values();
    expect(after.scale).toBeGreaterThanOrEqual(1);
    expect(after.scale).toBeLessThanOrEqual(1.025);
  });

  /**
   * Headless Chromium keeps every tab visible, so switching tabs never fires
   * visibilitychange. Report the tab as hidden or shown the way a browser does.
   */
  async function setTabHidden(page: Page, hidden: boolean) {
    await page.evaluate((value) => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (value ? "hidden" : "visible") });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  }

  test("pauses and resumes the persistent container when its tab is hidden", async ({ page }) => {
    await page.goto("/home");
    const host = await particleHost(page);
    await expect.poll(() => snapshot(host)).not.toBeNull();
    await setTabHidden(page, true);
    await expect.poll(() => snapshot(host)).toMatchObject({ pageHidden: true, animationStatus: false });
    await setTabHidden(page, false);
    await expect.poll(() => snapshot(host)).toMatchObject({ pageHidden: false, animationStatus: true });
  });
});
