import { expect, type Locator, type Page } from "@playwright/test";

const E2E_SESSION_TOKEN = "dolphub-e2e-session-token";
const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);

export async function authenticate(page: Page) {
  await page.context().addCookies([
    {
      name: "session",
      value: E2E_SESSION_TOKEN,
      url: `http://127.0.0.1:${E2E_PORT}`,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

/** Computed transform scale of an element, 1 when it has none. */
export async function scaleOf(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    if (transform === "none") return 1;
    const match = /matrix\(([^)]+)\)/.exec(transform);
    return match ? Number(match[1].split(",")[0]) : 1;
  });
}

/** Holds the pointer down on an element so :active styles apply, then releases. */
export async function whilePressed<T>(page: Page, locator: Locator, run: () => Promise<T>): Promise<T> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Element has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  try {
    return await run();
  } finally {
    await page.mouse.up();
  }
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(overflow.scroll, "page scrolls sideways").toBeLessThanOrEqual(overflow.inner);
}

export async function expectVisibleFocusRing(locator: Locator) {
  const styles = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outline: style.outlineStyle, width: style.outlineWidth, shadow: style.boxShadow };
  });
  const ring = (styles.outline !== "none" && styles.width !== "0px") || styles.shadow !== "none";
  expect(ring, `no visible focus ring: ${JSON.stringify(styles)}`).toBe(true);
}
