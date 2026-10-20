import { expect, test } from "@playwright/test";
import { authenticate } from "./helpers";

/*
 * The whole path a new student takes: no page, create one, add a project,
 * see it on /u/<handle> and the home showcase, then take it off again.
 * Each Playwright project signs in as its own newcomer, which
 * e2e/seed-auth.ts resets when the test server starts. A retry or
 * --repeat-each finds the page already made and fails at the first step,
 * so read the first attempt's error.
 */
test("a new student creates a page, publishes a project, and removes it", async ({ page }, testInfo) => {
  const project = testInfo.project.name;
  const handle = `e2e-new-${project}`;
  const name = `New Student ${project}`;
  await authenticate(page, `newcomer-${project}`);

  // The dashboard points a student without a page at the create form.
  await page.goto("/dashboard");
  const rail = page.getByTestId("identity-rail");
  await expect(rail.getByText("You don't have a public page yet.")).toBeVisible();
  await rail.getByRole("link", { name: "Create your page →" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your page");

  // Live handle check: a taken handle, then a free one.
  const handleInput = page.getByRole("textbox", { name: "Handle" });
  await handleInput.fill("mira");
  await expect(page.locator("#handle-status")).toHaveText("That handle is already taken");
  await handleInput.fill(handle);
  await expect(page.locator("#handle-status")).toHaveText(`/u/${handle} is free`, { ignoreCase: true });

  // The server's rules come back next to the field.
  await page.getByRole("button", { name: "Create my page" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("Name is required");
  await expect(page.getByRole("textbox", { name: "Name" })).toBeFocused();

  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("combobox", { name: "Course" }).selectOption({ label: "BS Computer Science" });
  await page.getByRole("textbox", { name: "Tagline" }).fill("Tools for the CS lab.");
  await page.getByRole("button", { name: "Create my page" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your page");
  await expect(page.getByRole("link", { name: `View /u/${handle} →` })).toHaveAttribute("href", `/u/${handle}`);

  // A page with no project exists but stays off the showcase.
  await page.goto(`/u/${handle}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByRole("article").getByText("No projects on this page yet.")).toBeVisible();

  // Add a project. A bad link is caught by the server and pointed at.
  await page.goto("/profile");
  await page.getByRole("button", { name: "Add project" }).click();
  await page.getByRole("textbox", { name: "Project 1 title" }).fill("Lab seat finder");
  await page.getByRole("textbox", { name: "Project 1 description" }).fill("Shows which lab PCs are free right now.");
  const demo = page.getByRole("textbox", { name: "Project 1 demo link" });
  await demo.fill("http://seats.example.com");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("Project 01: Link must be a full https:// address");
  await expect(demo).toBeFocused();

  await demo.fill("https://seats.example.com");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Saved. Your public page shows the changes now.");

  // Saving again with no edits creates nothing twice.
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Nothing to save.");

  // The public page and the home showcase show it straight away.
  await page.goto(`/u/${handle}`);
  const article = page.getByRole("article");
  await expect(article.getByRole("heading", { name: "Lab seat finder" })).toBeVisible();
  await expect(article.getByRole("link", { name: "Demo →" })).toHaveAttribute("href", "https://seats.example.com");
  await expect(article.getByText("Tools for the CS lab.")).toBeVisible();

  await page.goto("/");
  const card = page.locator(`[data-showcase-card="${handle}"]:visible`);
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Lab seat finder");

  // The dashboard now shows the page.
  await page.goto("/dashboard");
  await expect(rail.getByRole("heading", { name })).toBeVisible();
  await expect(rail.getByRole("link", { name: "View public page →" })).toHaveAttribute("href", `/u/${handle}`);

  // The saved project loads back into the editor. Opt out of search engines and remove the project.
  await page.goto("/profile");
  await expect(page.getByRole("textbox", { name: "Project 1 title" })).toHaveValue("Lab seat finder");
  await page.getByRole("checkbox", { name: "Show my page in search engines" }).uncheck();
  await page.getByRole("button", { name: "Remove project 1" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Saved. Your public page shows the changes now.");

  await page.goto(`/u/${handle}`);
  await expect(page.getByRole("article").getByText("No projects on this page yet.")).toBeVisible();
  const robots = await page
    .locator('meta[name="robots"]')
    .evaluateAll((tags) => tags.map((tag) => tag.getAttribute("content")));
  expect(robots.some((content) => content?.includes("noindex"))).toBe(true);

  await page.goto("/");
  await expect(page.locator('[data-showcase-card="mira"]:visible')).toHaveCount(1);
  await expect(page.locator(`[data-showcase-card="${handle}"]`)).toHaveCount(0);
});

test("a student with a page skips the create form", async ({ page }) => {
  await authenticate(page);
  await page.goto("/profile");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your page");
  await expect(page.getByRole("textbox", { name: "Handle" })).toHaveCount(0);
  await expect(page.getByText("/u/feed-test", { exact: true })).toBeVisible();
});
