import { expect, test } from "@playwright/test";
import { authenticate, expectNoHorizontalOverflow, expectVisibleFocusRing } from "./helpers";

test.describe("home", () => {
  test.beforeEach(async ({ page }) => authenticate(page));

  test("moves directly from the showcase to the publishing steps", async ({ page }) => {
    await page.goto("/home");

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
    await page.goto("/home");
    await expect(page.getByRole("tab")).toHaveCount(0);
    const group = page.getByRole("group", { name: "Filter by course" });
    const all = group.getByRole("button", { name: /^All \[/ });
    const cs = group.getByRole("button", { name: /^CS \[(\d+)\]/ });
    await expect(all).toHaveAttribute("aria-pressed", "true");
    await cs.click();
    await expect(cs).toHaveAttribute("aria-pressed", "true");
    await expect(all).toHaveAttribute("aria-pressed", "false");
    const expected = Number(/\[(\d+)\]/.exec((await cs.textContent()) ?? "")?.[1]);
    await expect(page.locator("[data-showcase-card]:visible")).toHaveCount(expected);
    const home = page.getByRole("link", { name: "Home" });
    const dashboard = page.getByRole("link", { name: "Dashboard" });
    await expect(home).toHaveAttribute("href", "/home");
    await expect(home).toHaveAttribute("aria-current", "page");
    await expect(dashboard).toHaveAttribute("href", "/dashboard");
    await expect(dashboard).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Profile" })).toBeVisible();
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
  const publicDestinations = ["What", "About", "Vision", "Privacy & Security", "Terms", "Support"];

  test("shows public destinations inline for signed-out desktop visitors", async ({ page }) => {
    for (const width of [1440, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");

      const primary = page.getByRole("navigation", { name: "Primary" });
      await expect(primary.getByRole("link")).toHaveText(publicDestinations);
      await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("centers signed-in account actions and keeps logout in the desktop burger", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await authenticate(page);
    await page.goto("/home");

    const account = page.getByRole("navigation", { name: "Account" });
    await expect(account.getByRole("link")).toHaveText(["Home", "Dashboard", "Profile"]);
    const center = await account.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
    expect(Math.abs(center - 512)).toBeLessThan(1);

    await page.getByRole("button", { name: "Open navigation menu" }).click();
    const menu = page.getByRole("navigation", { name: "Site menu" });
    await expect(
      menu.locator("a:visible").filter({ hasText: /^(What|About|Vision|Privacy & Security|Terms|Support)$/ }),
    ).toHaveText(publicDestinations);
    await expect(menu.getByRole("link", { name: "View your profile, /u/feed-test" })).toHaveAttribute(
      "href",
      "/u/feed-test",
    );
    await expect(menu.getByRole("button", { name: "Log out" })).toBeVisible();
  });

  test("opens the public profile from the account header and closes the menu", async ({ page }) => {
    await authenticate(page);
    await page.goto("/home");
    await page.getByRole("button", { name: "Open navigation menu" }).click();

    const menu = page.getByRole("navigation", { name: "Site menu" });
    const profileLink = menu.getByRole("link", { name: "View your profile, /u/feed-test" });
    await expect(profileLink).toHaveAttribute("href", "/u/feed-test");
    await expect(profileLink).toHaveClass(/hover:bg-paper/);
    await expect(profileLink).toHaveClass(/focus-visible:ring-2/);
    await profileLink.click();

    await expect(page).toHaveURL(/\/u\/feed-test$/);
    await expect(page.getByRole("navigation", { name: "Site menu" })).toHaveCount(0);
  });

  test("puts the account header first in the tab order and preserves Escape focus return", async ({ page }) => {
    await authenticate(page);
    await page.goto("/home");
    const trigger = page.getByRole("button", { name: "Open navigation menu" });
    await trigger.click();

    const menu = page.getByRole("navigation", { name: "Site menu" });
    const profileLink = menu.getByRole("link", { name: "View your profile, /u/feed-test" });
    await page.keyboard.press("Tab");
    await expect(profileLink).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/u\/feed-test$/);
  });

  test("routes members without a profile to the create profile form", async ({ page }, testInfo) => {
    await authenticate(page, `newcomer-${testInfo.project.name}`);
    await page.goto("/home");
    await page.getByRole("button", { name: "Open navigation menu" }).click();

    const menu = page.getByRole("navigation", { name: "Site menu" });
    const createLink = menu.getByRole("link", { name: "Create your profile" });
    await expect(createLink).toHaveAttribute("href", "/profile");
    await expect(createLink).toContainText("Create your profile");
    await createLink.click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your page");
    await expect(page.getByRole("navigation", { name: "Site menu" })).toHaveCount(0);
  });

  test("centers public links and separates signed-out authentication pills", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const primary = page.getByRole("navigation", { name: "Primary" });
    await expect(primary.getByRole("link")).toHaveText(publicDestinations);
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveCount(0);

    const login = page.getByRole("link", { name: "Log in", exact: true });
    const signup = page.getByRole("link", { name: "Sign up", exact: true });
    await expect(login).toHaveAttribute("href", "/login");
    await expect(signup).toHaveAttribute("href", "/login");
    await expect(login).toHaveClass(/rounded-full/);
    await expect(signup).toHaveClass(/rounded-full/);
  });

  test("uses the burger below desktop and only repeats authentication actions when hidden", async ({ page }) => {
    for (const width of [768, 375]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");

      await expect(page.getByRole("navigation", { name: "Primary" })).not.toBeVisible();
      const open = page.getByRole("button", { name: "Open navigation menu" });
      await expect(open).toHaveAttribute("aria-expanded", "false");
      await expect(open).toHaveAttribute("aria-controls", /.+/);
      await open.focus();
      await page.keyboard.press("Enter");

      const menu = page.getByRole("navigation", { name: "Site menu" });
      await expect(menu.locator("a:visible").filter({ hasText: /^(What|About|Vision|Privacy & Security|Terms|Support)$/ })).toHaveText(publicDestinations);
      await expect(page.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute("aria-expanded", "true");

      if (width === 768) {
        await expect(page.getByRole("link", { name: "Log in", exact: true })).toBeVisible();
        await expect(menu.getByRole("link", { name: "Log in", exact: true })).toHaveCount(0);
        await expect(menu.getByRole("link", { name: "Sign up", exact: true })).toHaveCount(0);
      } else {
        await expect(menu.getByRole("link", { name: "Log in", exact: true })).toHaveAttribute("href", "/login");
        await expect(menu.getByRole("link", { name: "Sign up", exact: true })).toHaveAttribute("href", "/login");
      }

      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeFocused();
    }
  });

  test("puts every destination in the phone menu and closes after navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await authenticate(page);
    await page.goto("/home");

    await expect(page.getByRole("link", { name: "Home" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Profile" })).toHaveCount(0);
    await page.getByRole("button", { name: "Open navigation menu" }).click();

    const menu = page.getByRole("navigation", { name: "Site menu" });
    await expect(
      menu.locator("a:visible").filter({ hasText: /^(What|About|Vision|Privacy & Security|Terms|Support)$/ }),
    ).toHaveText(publicDestinations);
    await expect(menu.getByRole("link", { name: "View your profile, /u/feed-test" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Profile", exact: true })).toBeVisible();
    await menu.getByRole("link", { name: "Privacy & Security" }).click();

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy & Security");
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.getByRole("navigation", { name: "Site menu" })).toHaveCount(0);
  });

  test("keeps an open menu available when resized to desktop", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 800 });
    await authenticate(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.getByRole("navigation", { name: "Site menu" })).toBeVisible();

    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(page.getByRole("navigation", { name: "Site menu" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close navigation menu" })).toBeVisible();
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
  test("shows public star counts and lets a signed-in student star another project", async ({ page }) => {
    await page.goto("/u/mira");
    await expect(page.getByRole("link", { name: /Star project \(\d+\)/ }).first()).toBeVisible();
    await authenticate(page);
    await page.goto("/u/mira");
    const star = page.getByRole("button", { name: /Star project \(\d+\)/ }).first();
    await expect(star).toHaveAttribute("aria-pressed", "false");
    await star.focus();
    await page.keyboard.press("Space");
    const starred = page.getByRole("button", { name: /Remove star \(\d+\)/ }).first();
    await expect(starred).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /Star project \(\d+\)/ }).first()).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

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
    await expect(page.getByRole("link", { name: "Report this page" })).toHaveAttribute(
      "href",
      "mailto:johncarlsantos30@gmail.com?subject=Report%20a%20student%20page%3A%20mira",
    );
    const projects = page.locator("ol > li.viewport-reveal");
    expect(await projects.count()).toBeGreaterThan(1);
    const ranges = await projects.evaluateAll((elements) =>
      elements.map((element) => ({
        start: (element as HTMLElement).style.getPropertyValue("--reveal-start"),
        end: (element as HTMLElement).style.getPropertyValue("--reveal-end"),
      })),
    );
    expect(ranges[0]).toEqual({ start: "5%", end: "30%" });
    expect(ranges[1]).toEqual({ start: "7.5%", end: "32.5%" });
  });

  test("a page without projects still opens, and stays off the home showcase", async ({ page }) => {
    await page.goto("/u/lea");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lea Mendoza");
    await expect(page.getByRole("article").getByText("No projects on this page yet.")).toBeVisible();
    await authenticate(page);
    await page.goto("/home");
    // :visible skips the hidden copy React keeps while streamed content swaps in.
    await expect(page.locator('[data-showcase-card="mira"]:visible')).toHaveCount(1);
    await expect(page.locator('[data-showcase-card="lea"]')).toHaveCount(0);
  });

  test("a showcase card opens that student's page", async ({ page }) => {
    await authenticate(page);
    await page.goto("/home");
    const card = page.locator('[data-showcase-card="kenji"]').getByRole("link");
    await expect(card).toHaveAttribute("href", "/u/kenji");
    await expect(card).toContainText("Lab gate logger");
    await card.click();
    await expect(page).toHaveURL(/\/u\/kenji$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kenji Ramos");
  });

  test("an unknown handle explains itself and offers a way back", async ({ page }) => {
    await page.goto("/u/nobody-here");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("No page for this handle.");
    await expect(page.getByRole("link", { name: "← Back to students" })).toHaveAttribute("href", "/home");
    // Streaming can leave more than one robots tag. Every one must say noindex.
    const robots = await page.locator('meta[name="robots"]').evaluateAll((tags) => tags.map((tag) => tag.getAttribute("content")));
    expect(robots.length).toBeGreaterThan(0);
    for (const content of robots) expect(content).toMatch(/noindex/);
  });
});

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => authenticate(page));

  test("marks Dashboard as current and separates profile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("link", { name: "Profile", exact: true })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("link", { name: "Edit profile" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  test("shows next steps and real open opportunities, with no sample feed", async ({ page }) => {
    await page.goto("/dashboard");
    // The seeded student has a page with no projects.
    const steps = page.getByRole("region", { name: "Next steps" });
    await expect(steps.getByText("1 of 3 done")).toBeVisible();
    await expect(steps.getByText("Create your page, done")).toBeAttached();
    await expect(steps.getByText("Add a project, not done yet")).toBeAttached();
    await expect(steps.getByRole("link", { name: "Continue your projects →" })).toHaveAttribute("href", "/profile/projects");

    const discover = page.getByTestId("discovery-rail");
    await expect(discover.getByRole("link", { name: /Cloud hack day/ })).toBeVisible();
    await expect(discover.getByRole("link", { name: "See all opportunities →" })).toHaveAttribute("href", "/opportunities");
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
  });

  test("uses three columns on desktop and stacks on phones", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");
    await expect(page.getByTestId("identity-rail")).toBeVisible();
    await expect(page.getByTestId("discovery-rail")).toBeVisible();

    await page.setViewportSize({ width: 320, height: 640 });
    await expect(page.getByTestId("identity-rail")).toBeVisible();
    await expect(page.getByTestId("discovery-rail")).toBeAttached();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("profile editor", () => {
  test.beforeEach(async ({ page }) => authenticate(page));

  test("marks Profile as current and preserves editor validation", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/profile");
    await expect(page.getByRole("navigation", { name: "Profile editor" }).getByRole("link", { name: "Details" }))
      .toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Profile editor" }).getByRole("link", { name: "Projects" }))
      .not.toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const github = page.getByRole("textbox", { name: "GitHub", exact: true });
    await github.fill("-bad-");
    await page.getByRole("button", { name: "Save changes" }).click();
    // The server rejects it, and the editor points at the field.
    await expect(page.locator("form").getByRole("alert")).toContainText("GitHub username");
    await expect(github).toBeFocused();
    await expect(github).toHaveAttribute("aria-invalid", "true");
  });

  test("opens the separate projects editor", async ({ page }) => {
    await page.goto("/profile/projects");
    const add = page.getByRole("button", { name: "Add project" });
    await expect(add).toBeVisible();
    await add.click();
    await expect(page.getByRole("textbox", { name: "Project 1 title" })).toBeVisible();
  });
});

test("profile editors redirect signed-out visitors to login", async ({ page }) => {
  for (const path of ["/profile", "/profile/projects"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
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

  // Browser tests run a production build, which must never offer the fixed-password admin.
  test("has no mock admin login in a production build", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Email me a sign-in link" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Local mock admin" })).toHaveCount(0);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });
});

test("logs out from the hamburger menu and clears the browser session", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 768, height: 800 });
  await authenticate(page, `logout-${testInfo.project.name}`);
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.getByRole("button", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "One link for every project you've built." })).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "session")).toBeUndefined();

  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login$/);
});

for (const path of ["/", "/u/mira", "/dashboard", "/profile", "/profile/projects", "/login", "/privacy", "/terms", "/support"]) {
  test.describe(path, () => {
    test("every control has a name and the first few tab stops show a ring", async ({ page }) => {
      if (path === "/dashboard" || path === "/profile" || path === "/profile/projects") await authenticate(page);
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
      if (path === "/dashboard" || path === "/profile" || path === "/profile/projects") await authenticate(page);
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
    });
  });
}
