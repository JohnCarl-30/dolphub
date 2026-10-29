import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { authenticate } from "./helpers";
import { createProfile } from "./profile-editor-helpers";

test("projects route redirects students without a profile to profile creation", async ({ page }, testInfo) => {
  await authenticate(page, `newcomer-projects-empty-${testInfo.project.name}`);
  await page.goto("/profile/projects");
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Create your page");
  await expect(page.getByRole("navigation", { name: "Profile editor" })).toHaveCount(0);
});

test("projects are edited separately, with photo limits and unsaved-change warnings", async ({ page }, testInfo) => {
  const suffix = `projects-${testInfo.project.name}`;
  await authenticate(page, `newcomer-${suffix}`);
  const { handle } = await createProfile(page, suffix);

  await page.goto("/profile/projects");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your projects");
  await expect(page.getByRole("navigation", { name: "Profile editor" }).getByRole("link", { name: "Projects" }))
    .toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Profile editor" }).getByRole("link", { name: "Details" }))
    .not.toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: `View /u/${handle} →` })).toHaveAttribute("href", `/u/${handle}`);
  const routeRobots = await page.locator('meta[name="robots"]').evaluateAll((tags) => tags.map((tag) => tag.getAttribute("content")));
  expect(routeRobots.some((content) => content?.includes("noindex"))).toBe(true);

  await page.getByRole("button", { name: "Add project" }).click();
  const title = page.getByRole("textbox", { name: "Project 1 title" });
  await title.fill("Campus map");
  await page.getByRole("textbox", { name: "Project 1 description" }).fill("A map of useful places.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Saved. Your public page shows the changes now.");

  const photo = await sharp({ create: { width: 32, height: 32, channels: 3, background: "#3366cc" } }).png().toBuffer();
  const addPhoto = page.getByLabel("Add a photo to project 1");
  await addPhoto.setInputFiles({ name: "campus.png", mimeType: "image/png", buffer: photo });
  await expect(page.getByRole("img", { name: "Photo 1 of Campus map" })).toBeVisible();
  await expect(page.getByText("Photos: 1 of 10 used")).toBeVisible();
  await page.getByRole("button", { name: "Remove photo 1 from project 1" }).click();
  await expect(page.getByText("Photos: 0 of 10 used")).toBeVisible();

  for (let index = 0; index < 10; index++) {
    await addPhoto.setInputFiles({ name: `campus-${index}.png`, mimeType: "image/png", buffer: photo });
    await expect(page.getByText(`Photos: ${index + 1} of 10 used`)).toBeVisible();
  }
  await expect(addPhoto).toBeDisabled();

  await title.fill("Campus map, updated");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Saved. Your public page shows the changes now.");
  await expect(page.getByRole("textbox", { name: "Project 1 title" })).toHaveValue("Campus map, updated");

  await page.getByRole("button", { name: "Add project" }).click();
  const secondTitle = page.getByRole("textbox", { name: "Project 2 title" });
  await secondTitle.fill("Draft project");
  const unloadWarned = await page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    return window.dispatchEvent(event) === false;
  });
  expect(unloadWarned).toBe(true);

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("navigation", { name: "Profile editor" }).getByRole("link", { name: "Details" }).click();
  await expect(page).toHaveURL(/\/profile\/projects$/);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("navigation", { name: "Profile editor" }).getByRole("link", { name: "Details" }).click();
  await expect(page).toHaveURL(/\/profile$/);

  await page.goto("/profile/projects");
  await expect(page.getByRole("textbox", { name: "Project 1 title" })).toHaveValue("Campus map, updated");
  await page.getByRole("button", { name: "Remove project 1" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Saved. Your public page shows the changes now.");
  await expect(page.getByText("Add a project to appear in the home showcase.")).toBeVisible();
  await page.goto(`/u/${handle}`);
  await expect(page.getByRole("article").getByText("No projects on this page yet.")).toBeVisible();
});

test("signed-out visitors are redirected from the projects editor", async ({ page }) => {
  await page.goto("/profile/projects");
  await expect(page).toHaveURL(/\/login$/);
});
