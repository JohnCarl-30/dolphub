import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, expectVisibleFocusRing } from "./helpers";

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
    await expect(page.getByRole("link", { name: "[ 00 ] Students" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("link", { name: "[ 01 ] Dashboard" })).not.toHaveAttribute("aria-current", "page");
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
  test("a save announces a status and a bad GitHub value raises an alert", async ({ page }) => {
    await page.goto("/dashboard");
    const github = page.getByRole("textbox", { name: "GitHub", exact: true });
    await expect(github).toHaveAccessibleDescription(/Your username or profile link/);
    await github.fill("-bad-");
    await page.getByRole("button", { name: "Save in this tab" }).click();
    // Scoped to the form: Next.js keeps its own route announcer with role="alert".
    const form = page.locator("form");
    const alert = form.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveClass(/rise/);
    await github.fill("octocat");
    await page.getByRole("button", { name: "Save in this tab" }).click();
    await expect(form.getByRole("status")).toContainText("Saved in this tab");
    await expect(alert).toHaveCount(0);
  });

  test("adding a project reveals a fieldset that rises in", async ({ page }) => {
    await page.goto("/dashboard");
    const before = await page.locator("fieldset").count();
    await page.getByRole("button", { name: "Add project" }).click();
    const fieldsets = page.locator("fieldset");
    await expect(fieldsets).toHaveCount(before + 1);
    await expect(fieldsets.last()).toHaveClass(/rise/);
    await expect(page.getByRole("button", { name: "Remove project" }).last()).toBeVisible();
  });
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

for (const path of ["/", "/u/mira", "/dashboard", "/login"]) {
  test.describe(path, () => {
    test("every control has a name and the first few tab stops show a ring", async ({ page }) => {
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
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
    });
  });
}
