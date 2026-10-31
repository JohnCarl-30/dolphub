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

  // Nothing to save yet, so the empty state leads with adding a project.
  await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  await page.getByRole("button", { name: "Add your first project" }).click();
  const title = page.getByRole("textbox", { name: "Project 1 title" });
  await title.fill("Campus map");
  await page.getByRole("textbox", { name: "Project 1 description" }).fill("A map of useful places.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Saved. Your public page shows the changes now.");

  const photo = await sharp({ create: { width: 32, height: 32, channels: 3, background: "#3366cc" } }).png().toBuffer();
  const addPhoto = page.getByLabel("Add a photo to project 1");
  await addPhoto.setInputFiles({ name: "campus.png", mimeType: "image/png", buffer: photo });
  await expect(page.getByText("Photos: 0 of 10 used")).toBeVisible();
  await page.getByRole("button", { name: "Use photo" }).click();
  await expect(page.getByRole("img", { name: "Photo 1 of Campus map" })).toBeVisible();
  await expect(page.getByText("Photos: 1 of 10 used")).toBeVisible();
  await page.getByRole("button", { name: "Remove photo 1 from project 1" }).click();
  await expect(page.getByText("Photos: 0 of 10 used")).toBeVisible();

  for (let index = 0; index < 10; index++) {
    await addPhoto.setInputFiles({ name: `campus-${index}.png`, mimeType: "image/png", buffer: photo });
    await page.getByRole("button", { name: "Use photo" }).click();
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
  await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  await page.goto(`/u/${handle}`);
  await expect(page.getByRole("article").getByText("No projects on this page yet.")).toBeVisible();
});

test("signed-out visitors are redirected from the projects editor", async ({ page }) => {
  await page.goto("/profile/projects");
  await expect(page).toHaveURL(/\/login$/);
});

test("project photo retry sends the confirmed 16:9 edit without reopening the editor", async ({ page }, testInfo) => {
  const suffix = `proj-edit-${testInfo.project.name}`;
  await authenticate(page, `newcomer-project-photo-editor-${testInfo.project.name}`);
  const { handle } = await createProfile(page, suffix);
  await page.goto("/profile/projects");
  await page.getByRole("button", { name: "Add project" }).click();
  await page.getByRole("textbox", { name: "Project 1 title" }).fill("Campus map");
  await page.getByRole("textbox", { name: "Project 1 description" }).fill("Places on campus.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toContainText("Saved.");

  const photo = await sharp({ create: { width: 80, height: 80, channels: 3, background: "#3366cc" } }).png().toBuffer();
  let requests = 0;
  await page.route("**/api/upload", async (route) => {
    requests++;
    if (requests === 1) await route.abort("failed");
    else await route.continue();
  });
  await page.getByLabel("Add a photo to project 1").setInputFiles({ name: "campus.png", mimeType: "image/png", buffer: photo });
  await expect(page.getByRole("dialog", { name: "Preview photo" })).toBeVisible();
  await expect(page.getByText("Photos: 0 of 10 used")).toBeVisible();
  expect(requests).toBe(0);
  if (testInfo.project.name === "phone") {
    const box = await page.getByLabel("Photo crop area").boundingBox();
    expect(box).not.toBeNull();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x - 25, y }, { x: x + 25, y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 55, y }, { x: x + 55, y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByRole("slider", { name: "Zoom" })).not.toHaveValue("1");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 20, y: y + 15 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  }
  await page.getByRole("button", { name: "Use photo" }).click();
  await expect(page.getByRole("button", { name: "Try again: upload the photo for project 1" })).toBeVisible();
  await expect(page.getByLabel("Add a photo to project 1")).toBeFocused();
  await expect(page.getByText("Photos: 0 of 10 used")).toBeVisible();
  await page.getByRole("button", { name: "Try again: upload the photo for project 1" }).click();
  await expect(page.getByText("Photos: 1 of 10 used")).toBeVisible();
  expect(requests).toBe(2);
  await expect(page.getByRole("dialog", { name: "Preview photo" })).toHaveCount(0);

  await page.goto(`/u/${handle}`);
  const image = page.getByRole("img", { name: "Screenshot of Campus map" });
  const response = await page.request.get(await image.getAttribute("src") ?? "");
  const metadata = await sharp(await response.body()).metadata();
  expect(metadata.width).toBeTruthy();
  expect(metadata.height).toBeTruthy();
  expect(metadata.width! / metadata.height!).toBeCloseTo(16 / 9, 1);
});
