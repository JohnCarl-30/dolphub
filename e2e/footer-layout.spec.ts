import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tall desktop", width: 1440, height: 1400 },
  { name: "short desktop", width: 1440, height: 600 },
  { name: "mobile", width: 390, height: 844 },
];

const routes = [
  { path: "/about", name: "about" },
  { path: "/", name: "landing" },
  { path: "/privacy", name: "long page" },
];

for (const viewport of viewports) {
  for (const route of routes) {
    test(`keeps the footer in normal flow on ${route.name} at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(route.path);
      await expect(page.getByRole("contentinfo")).toBeVisible();

      const layout = await page.evaluate(() => {
        const shell = document.querySelector('[class~="min-h-dvh"]');
        const main = document.querySelector("main");
        const footer = document.querySelector("footer");
        const particleLayer = document.querySelector("[data-particle-layer]");
        if (!shell || !main || !footer || !particleLayer) throw new Error("Shared shell is incomplete");

        const footerRect = footer.getBoundingClientRect();
        return {
          documentHeight: document.documentElement.scrollHeight,
          footerBottom: footerRect.bottom,
          viewportHeight: window.innerHeight,
          footerPosition: getComputedStyle(footer).position,
          mainFlex: getComputedStyle(main).flex,
          shellClasses: shell.className,
          particlePosition: getComputedStyle(particleLayer).position,
        };
      });

      expect(layout.footerPosition).toBe("static");
      expect(layout.mainFlex).toBe("1 0 auto");
      expect(layout.shellClasses).toContain("min-h-dvh");
      expect(layout.particlePosition).toBe("fixed");
      expect(layout.footerBottom).toBeGreaterThanOrEqual(layout.viewportHeight - 1);
      expect(layout.footerBottom).toBeLessThanOrEqual(layout.documentHeight + 1);
    });
  }
}
