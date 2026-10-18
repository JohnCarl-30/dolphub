import { expect, test } from "@playwright/test";
import { authenticate, expectNoHorizontalOverflow, expectVisibleFocusRing } from "./helpers";

test.describe("home", () => {
  test("moves directly from the showcase to the publishing steps", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("region", { name: "Community statistics" })).toHaveCount(0);
    await expect(page.getByText("Published pages", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Courses on the filter", { exact: true })).toHaveCount(0);

    const skip = page.getByRole("link", { name: "Skip showcase ↓" });
    await expect(skip).toHaveAttribute("href", "#after-showcase");
    await skip.click();

    const publishing = page.getByRole("region", { name: "Publishing steps" });
    await expect(publishing).toBeFocused();
    await expect(publishing.getByRole("heading", { name: "How a page gets published" })).toBeVisible();
  });

  test("filters are toggle buttons and the current nav link is marked", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("tab")).toHaveCount(0);
    const group = page.getByRole("group", { name: "Filter by course" });
    const all = group.getByRole("button", { name: /^All \[/ });
    const cs = group.getByRole("button", { name: /^CS \[(\d+)\]/ });
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await cs.click();
    await expect(cs).toHaveAttribute("aria-pressed", "true");
    await expect(all).toHaveAttribute("aria-pressed", "false");
    const expected = Number(/\[(\d+)\]/.exec((await cs.textContent()) ?? "")?.[1]);
    await expect(page.locator("[data-showcase-card]")).toHaveCount(expected);
    const home = page.getByRole("link", { name: "[ 00 ] Home" });
    const dashboard = page.getByRole("link", { name: "[ 01 ] Dashboard" });
    const profile = page.getByRole("link", { name: "[ 02 ] Profile" });
    await expect(home).toHaveAttribute("href", "/");
    await expect(home).toHaveAttribute("aria-current", "page");
    await expect(dashboard).toHaveAttribute("href", "/dashboard");
    await expect(dashboard).not.toHaveAttribute("aria-current", "page");
    await expect(profile).toHaveAttribute("href", "/profile");
    await expect(profile).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Dolphub · Built for PCU tech students", { exact: true })).toBeVisible();
    await expect(
      page.getByText("© 2026 Dolphub contributors · MIT License", { exact: true }),
    ).toBeVisible();
    const footer = page.getByRole("navigation", { name: "Footer" });
    await expect(footer.getByRole("link", { name: "Privacy & Security" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    await expect(footer.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    await expect(footer.getByRole("link", { name: "Support" })).toHaveAttribute("href", "/support");
    await expect(page.getByText(/Mock pages|No sign-in|Edits stay in this tab/i)).toHaveCount(0);
  });
});

test.describe("site menu", () => {
  test("keeps primary links visible on desktop and closes with Escape or an outside click", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await expect(page.getByRole("link", { name: "[ 00 ] Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "[ 01 ] Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "[ 02 ] Profile" })).toBeVisible();

    const open = page.getByRole("button", { name: "Open navigation menu" });
    await open.click();
    await expect(page.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    const menu = page.getByRole("navigation", { name: "Site menu" });
    await expect(menu.getByRole("link", { name: "[ 03 ] Privacy & Security" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "[ 04 ] Terms" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "[ 05 ] Support" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "[ 00 ] Home" })).toBeHidden();

    await page.keyboard.press("Escape");
    const reopened = page.getByRole("button", { name: "Open navigation menu" });
    await expect(menu).toHaveCount(0);
    await expect(reopened).toBeFocused();

    await reopened.click();
    await page.getByRole("heading", { level: 1 }).click();
    await expect(page.getByRole("navigation", { name: "Site menu" })).toHaveCount(0);
  });

  test("puts every destination in the phone menu and closes after navigation", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");

    await expect(page.getByRole("link", { name: "[ 00 ] Home" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "[ 01 ] Dashboard" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "[ 02 ] Profile" })).toHaveCount(0);
    await page.getByRole("button", { name: "Open navigation menu" }).click();

    const menu = page.getByRole("navigation", { name: "Site menu" });
    await expect(menu.getByRole("link", { name: "[ 00 ] Home" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "[ 01 ] Dashboard" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "[ 02 ] Profile" })).toBeVisible();
    await menu.getByRole("link", { name: "[ 03 ] Privacy & Security" }).click();

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy & Security");
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.getByRole("navigation", { name: "Site menu" })).toHaveCount(0);
  });
});

const infoPages = [
  { path: "/privacy", title: "Privacy & Security" },
  { path: "/terms", title: "Terms & Conditions" },
  { path: "/support", title: "Support" },
];

test.describe("information pages", () => {
  for (const info of infoPages) {
    test(`${info.path} has its heading, canonical URL and review date`, async ({ page }) => {
      await page.goto(info.path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(info.title);
      await expect(page.getByText("Last updated · October 18, 2026")).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${info.path}$`));
    });
  }

  test("support offers email help and private security reporting", async ({ page }) => {
    await page.goto("/support");
    await expect(page.getByRole("link", { name: "Email Evert Matthew Matias · fnzh.4u@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:fnzh.4u@gmail.com?subject=Dolphub%20support",
    );
    await expect(page.getByRole("link", { name: "Email John Carl · johncarlsantos30@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:johncarlsantos30@gmail.com?subject=Dolphub%20support",
    );
    await expect(page.getByRole("link", { name: "private GitHub vulnerability report" })).toHaveAttribute(
      "href",
      "https://github.com/JohnCarl-30/dolphub/security/advisories/new",
    );
  });

  test("legal and support pages use maintainer contacts instead of the retired support mailbox", async ({ page }) => {
    for (const info of infoPages) {
      await page.goto(info.path);
      await expect(page.locator('a[href^="mailto:fnzh.4u@gmail.com"]')).not.toHaveCount(0);
      await expect(page.locator('a[href^="mailto:johncarlsantos30@gmail.com"]')).not.toHaveCount(0);
      await expect(page.locator('a[href*="dolphub.tech"]')).toHaveCount(0);
    }
  });
});

test.describe("profile", () => {
  test("shows contact links and projects, with projects staggered", async ({ page }) => {
    await page.goto("/u/mira");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mira Santos");
    await expect(page.getByRole("link", { name: "GitHub: mira-santos" })).toHaveAttribute(
      "href",
      "https://github.com/mira-santos",
    );
    await expect(page.getByRole("link", { name: "Email Mira Santos" })).toHaveAttribute(
      "href",
      "mailto:mira.santos@example.com",
    );
    const projects = page.locator("ol > li.rise");
    expect(await projects.count()).toBeGreaterThan(1);
    const delays = await projects.evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).animationDelay),
    );
    expect(delays[0]).toBe("0s");
    expect(delays[1]).toBe("0.05s");
  });

  test("an unknown handle explains itself and offers a way back", async ({ page }) => {
    await page.goto("/u/nobody-here");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("No page for this handle.");
    await expect(page.getByRole("link", { name: "← Back to students" })).toHaveAttribute("href", "/");
  });
});

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => authenticate(page));

  test("marks Dashboard as current and separates profile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "[ 00 ] Home" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("link", { name: "[ 01 ] Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("link", { name: "[ 02 ] Profile" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("link", { name: "Edit profile" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  test("validates and publishes a temporary post", async ({ page }) => {
    await page.goto("/dashboard");
    const composer = page.getByRole("textbox", { name: "Share an update" });
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "Write something before publishing.",
    );

    await composer.fill("Testing the new project demo with our class today.");
    await page.getByRole("button", { name: "Publish" }).click();
    const firstPost = page.getByTestId("feed-posts").locator("li[data-post-id]").first();
    await expect(firstPost).toContainText("Testing the new project demo with our class today.");
    await expect(firstPost).toContainText("Now");
  });

  test("reacts, opens comments, and applies both sort modes", async ({ page }) => {
    await page.goto("/dashboard");
    const posts = page.getByTestId("feed-posts").locator("li[data-post-id]");
    await expect(posts.first()).toHaveAttribute("data-post-id", "orgfair-preview");

    const firstPost = posts.first();
    await firstPost.getByRole("button", { name: "React", exact: true }).click();
    await expect(firstPost.getByText("25 reactions")).toBeVisible();
    await firstPost.getByRole("button", { name: "Comments" }).click();
    await expect(firstPost.getByText("The quick filters make this much easier to scan.")).toBeVisible();

    await page.getByRole("button", { name: "Top" }).click();
    await expect(posts.first()).toHaveAttribute("data-post-id", "lab-gate-demo");
    await page.getByRole("button", { name: "Recent" }).click();
    await expect(posts.first()).toHaveAttribute("data-post-id", "orgfair-preview");
  });

  test("uses three columns on desktop and hides discovery on phones", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await expect(page.getByTestId("identity-rail")).toBeVisible();
    await expect(page.getByTestId("discovery-rail")).toBeVisible();

    await page.setViewportSize({ width: 320, height: 640 });
    await expect(page.getByTestId("identity-rail")).toBeVisible();
    await expect(page.getByTestId("discovery-rail")).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("profile editor", () => {
  test.beforeEach(async ({ page }) => authenticate(page));

  test("marks Profile as current and preserves editor validation", async ({ page }) => {
    await page.goto("/profile");
    if ((page.viewportSize()?.width ?? 0) < 640) {
      await page.getByRole("button", { name: "Open navigation menu" }).click();
    }
    await expect(page.getByRole("link", { name: "[ 02 ] Profile" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const github = page.getByRole("textbox", { name: "GitHub", exact: true });
    await github.fill("-bad-");
    await page.getByRole("button", { name: "Save in this tab" }).click();
    await expect(page.locator("form").getByRole("alert")).toBeVisible();
  });

  test("can add a project", async ({ page }) => {
    await page.goto("/profile");
    const before = await page.locator("fieldset").count();
    await page.getByRole("button", { name: "Add project" }).click();
    await expect(page.locator("fieldset")).toHaveCount(before + 1);
  });
});

test("the profile editor redirects signed-out visitors to login", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
});

test.describe("login", () => {
  test("uses the shared tokens and a single main landmark", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("main")).toHaveCount(1);
    const button = page.getByRole("button", { name: "Email me a sign-in link" });
    const styles = await button.evaluate((element) => {
      const style = getComputedStyle(element);
      return { radius: style.borderRadius, background: style.backgroundColor };
    });
    expect(styles.radius).toBe("0px");
    expect(styles.background).toBe("rgb(14, 16, 18)");
    await expect(button).toHaveClass(/press/);
  });
});

for (const path of ["/", "/u/mira", "/dashboard", "/profile", "/login", "/privacy", "/terms", "/support"]) {
  test.describe(path, () => {
    test("every control has a name and the first few tab stops show a ring", async ({ page }) => {
      if (path === "/dashboard" || path === "/profile") await authenticate(page);
      await page.goto(path);
      const unnamed = await page.locator("a, button").evaluateAll((elements) =>
        elements
          .filter((element) => {
            const name =
              element.getAttribute("aria-label") ??
              element.getAttribute("aria-labelledby") ??
              element.textContent?.trim();
            return !name;
          })
          .map((element) => element.outerHTML.slice(0, 80)),
      );
      expect(unnamed).toEqual([]);
      for (let index = 0; index < 4; index++) {
        await page.keyboard.press("Tab");
        const focused = page.locator(":focus");
        if ((await focused.count()) === 0) break;
        await expectVisibleFocusRing(focused);
      }
    });

    test("nothing spills past the viewport edge", async ({ page }) => {
      if (path === "/dashboard" || path === "/profile") await authenticate(page);
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
    });
  });
}
