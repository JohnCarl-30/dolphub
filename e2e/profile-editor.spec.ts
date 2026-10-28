import { expect, test } from "@playwright/test";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
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
  // Typing a name instead of a handle offers the handle that name would make.
  await handleInput.fill(`New Student ${project}`);
  await page.getByRole("button", { name: `Use /u/new-student-${project}` }).click();
  await expect(handleInput).toHaveValue(`new-student-${project}`);
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

  // The dedicated portrait saves immediately and does not require a project.
  const portrait = await sharp({ create: { width: 480, height: 640, channels: 3, background: "#f5a623" } })
    .png()
    .toBuffer();
  await page.getByLabel("Upload profile picture").setInputFiles({ name: "portrait.png", mimeType: "image/png", buffer: portrait });
  await expect(page.getByRole("img", { name: `Profile picture of ${name}` })).toBeVisible();

  // A page with no project exists but stays off the showcase.
  await page.goto(`/u/${handle}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByRole("img", { name: `Profile picture of ${name}` })).toBeVisible();
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

  // A link typed without https:// gets it added by the server.
  await demo.fill("seats.example.com");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Saved. Your public page shows the changes now.");

  // Saving again with no edits creates nothing twice.
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Nothing to save.");

  // Photos upload as soon as they're chosen. A file that isn't an image is refused by the server.
  const addPhoto = page.getByLabel("Add a photo to project 1");
  await addPhoto.setInputFiles({ name: "notes.png", mimeType: "image/png", buffer: Buffer.from("not a picture") });
  await expect(page.locator("form").getByRole("alert")).toHaveText("Photo: That file is not an image we can read.");
  // The older "Nothing to save." notice goes away once a photo is chosen.
  await expect(page.locator("form").getByRole("status")).toHaveCount(0);
  const screenshot = await sharp({ create: { width: 640, height: 360, channels: 3, background: "#2f6fdf" } })
    .png()
    .toBuffer();
  await addPhoto.setInputFiles({ name: "seats.png", mimeType: "image/png", buffer: screenshot });
  await expect(page.getByRole("img", { name: "Photo 1 of Lab seat finder" })).toBeVisible();
  await expect(page.locator("form").getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("Photos: 1 of 10 used")).toBeVisible();

  // A phone photo over the 4 MB cap is shrunk in the browser before it is sent.
  const side = 1500;
  const bigPhoto = await sharp(randomBytes(side * side * 3), { raw: { width: side, height: side, channels: 3 } })
    .png()
    .toBuffer();
  // The server refuses anything over 4 MB, so this photo only lands if the browser shrank it.
  expect(bigPhoto.byteLength).toBeGreaterThan(4 * 1024 * 1024);
  await addPhoto.setInputFiles({ name: "camera.png", mimeType: "image/png", buffer: bigPhoto });
  // Shrinking in the browser, then re-encoding noise on the server, takes several seconds on a CI runner.
  await expect(page.getByRole("img", { name: "Photo 2 of Lab seat finder" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Photos: 2 of 10 used")).toBeVisible();

  // The public page and the home showcase show it straight away.
  await page.goto(`/u/${handle}`);
  const article = page.getByRole("article");
  await expect(article.getByRole("heading", { name: "Lab seat finder" })).toBeVisible();
  const shown = article.getByRole("img", { name: "Screenshot of Lab seat finder" });
  await expect(shown).toBeVisible();
  // The browser really loaded the stored WebP, not a broken image.
  await expect.poll(() => shown.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(640);
  await expect(article.getByRole("link", { name: "Demo →" })).toHaveAttribute("href", "https://seats.example.com");
  await expect(article.getByText("Tools for the CS lab.")).toBeVisible();

  await page.goto("/home");
  const card = page.locator(`[data-showcase-card="${handle}"]:visible`);
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Lab seat finder");
  await expect(card.locator("img")).toHaveAttribute("src", /\/dev-images\/profiles\/.+\.webp$/);

  // The dashboard now shows the page, with every step done.
  await page.goto("/dashboard");
  await expect(rail.getByRole("heading", { name })).toBeVisible();
  await expect(rail.getByRole("img", { name: `Profile picture of ${name}` })).toBeVisible();
  const steps = page.getByRole("region", { name: "Your page is ready" });
  await expect(steps.getByText("3 of 3 done")).toBeVisible();
  await expect(steps.getByRole("link", { name: `dolphub.tech/u/${handle}` })).toHaveAttribute("href", `/u/${handle}`);
  await expect(rail.getByRole("link", { name: "View public page →" })).toHaveAttribute("href", `/u/${handle}`);

  // Sharing hands the full link to the share sheet, and copies it where there is no share sheet.
  const shareButton = steps.getByRole("button", { name: "Share my page" });
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => void ((window as unknown as { shared: ShareData }).shared = data),
    });
  });
  await shareButton.click();
  const shared = await page.evaluate(() => (window as unknown as { shared: ShareData }).shared);
  expect(shared.url).toBe(new URL(`/u/${handle}`, page.url()).href);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: undefined }));
  await shareButton.click();
  await expect(steps.getByRole("status")).toHaveText("Link copied.");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shared.url);

  // The saved project and its photo load back into the editor. Removing the photo saves straight away.
  await page.goto("/profile");
  await expect(page.getByRole("textbox", { name: "Project 1 title" })).toHaveValue("Lab seat finder");
  await page.getByRole("button", { name: "Remove photo 1 from project 1" }).click();
  await expect(page.getByRole("img", { name: "Photo 2 of Lab seat finder" })).toHaveCount(0);
  await expect(page.getByText("Photos: 1 of 10 used")).toBeVisible();

  // Opt out of search engines and remove the project, which deletes its last photo too.
  await page.getByRole("checkbox", { name: "Show my page in search engines" }).uncheck();
  await page.getByRole("button", { name: "Remove project 1" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Saved. Your public page shows the changes now.");

  await page.goto(`/u/${handle}`);
  await expect(page.getByRole("article").getByText("No projects on this page yet.")).toBeVisible();
  await expect(page.getByRole("article").getByRole("img", { name: `Profile picture of ${name}` })).toBeVisible();
  await expect(page.getByRole("article").getByRole("img", { name: /Screenshot of/ })).toHaveCount(0);
  const robots = await page
    .locator('meta[name="robots"]')
    .evaluateAll((tags) => tags.map((tag) => tag.getAttribute("content")));
  expect(robots.some((content) => content?.includes("noindex"))).toBe(true);

  await page.goto("/home");
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
