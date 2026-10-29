import { expect, test } from "@playwright/test";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { authenticate } from "./helpers";
import { createProfile } from "./profile-editor-helpers";

test("profile details save independently from projects", async ({ page }, testInfo) => {
  const suffix = `details-${testInfo.project.name}`;
  await authenticate(page, `newcomer-${suffix}`);
  const { handle, name } = await createProfile(page, suffix);

  await expect(page.getByRole("navigation", { name: "Profile editor" }).getByRole("link", { name: "Details" }))
    .toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Profile editor" }).getByRole("link", { name: "Projects" }))
    .not.toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: "Add project" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: `View /u/${handle} →` })).toHaveAttribute("href", `/u/${handle}`);

  await page.getByRole("textbox", { name: "Tagline" }).fill("Building useful campus tools.");
  await page.getByRole("textbox", { name: "Contact email" }).fill("public@example.com");
  await page.getByRole("checkbox", { name: "Show my page in search engines" }).uncheck();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("form").getByRole("status")).toHaveText("Saved. Your public page shows the changes now.");

  const portrait = await sharp({ create: { width: 48, height: 64, channels: 3, background: "#f5a623" } }).png().toBuffer();
  await page.getByLabel("Upload profile picture").setInputFiles({ name: "portrait.png", mimeType: "image/png", buffer: portrait });
  await expect(page.getByRole("dialog", { name: "Preview photo" })).toBeVisible();
  await page.getByRole("button", { name: "Use photo" }).click();
  await expect(page.getByRole("img", { name: `Profile picture of ${name}` })).toBeVisible();

  await page.goto(`/u/${handle}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByText("Building useful campus tools.")).toBeVisible();
  await expect(page.getByRole("link", { name: `Email ${name}` })).toHaveAttribute("href", "mailto:public@example.com");
  const robots = await page.locator('meta[name="robots"]').evaluateAll((tags) => tags.map((tag) => tag.getAttribute("content")));
  expect(robots.some((content) => content?.includes("noindex"))).toBe(true);
});

test("profile picture edits only upload after confirmation and save the rotated crop", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const suffix = `photo-editor-${testInfo.project.name}`;
  await authenticate(page, `newcomer-${suffix}`);
  const { handle, name } = await createProfile(page, suffix);
  const red = await sharp({ create: { width: 40, height: 40, channels: 3, background: "#ed2222" } }).png().toBuffer();
  const photo = await sharp({ create: { width: 80, height: 40, channels: 3, background: "#2222ed" } })
    .composite([{ input: red, left: 0, top: 0 }]).png().toBuffer();
  const picked = { name: "two-colors.png", mimeType: "image/png", buffer: photo };
  const picker = page.getByLabel("Upload profile picture");
  const uploads: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/profile-picture") && request.method() === "POST") uploads.push(request.url());
  });

  await picker.setInputFiles(picked);
  await expect(page.getByRole("dialog", { name: "Preview photo" })).toBeVisible();
  expect(uploads).toHaveLength(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Preview photo" })).toHaveCount(0);
  await expect(picker).toBeFocused();
  expect(uploads).toHaveLength(0);
  await expect(page.getByRole("img", { name: `Profile picture of ${name}` })).toHaveCount(0);

  await picker.setInputFiles(picked);
  await expect(page.getByRole("dialog", { name: "Preview photo" })).toBeVisible();
  await page.getByRole("button", { name: "Rotate right 90 degrees" }).click();
  const zoom = page.getByRole("slider", { name: "Zoom" });
  await zoom.focus();
  await page.keyboard.press("ArrowRight");
  await expect(zoom).not.toHaveValue("1");
  await page.getByRole("button", { name: "Use photo" }).click();
  await expect(page.getByRole("img", { name: `Profile picture of ${name}` })).toBeVisible();
  await expect(picker).toBeFocused();
  expect(uploads).toHaveLength(1);

  await page.goto(`/u/${handle}`);
  const image = page.getByRole("img", { name: `Profile picture of ${name}` });
  const response = await page.request.get(await image.getAttribute("src") ?? "");
  expect(response.ok()).toBe(true);
  const decoded = sharp(await response.body());
  const metadata = await decoded.metadata();
  expect(metadata.width).toBe(metadata.height);
  const raw = await decoded.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const top = raw.data.subarray(((raw.info.width * Math.floor(raw.info.height * 0.2)) + Math.floor(raw.info.width / 2)) * 3);
  const bottom = raw.data.subarray(((raw.info.width * Math.floor(raw.info.height * 0.8)) + Math.floor(raw.info.width / 2)) * 3);
  expect(top[0]).toBeGreaterThan(top[2]);
  expect(bottom[2]).toBeGreaterThan(bottom[0]);

  // EXIF orientation must be applied once: this file's pixels are landscape, but its tag makes it portrait.
  const oriented = await sharp(photo).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  await page.goto("/profile");
  const previousSrc = await page.getByRole("img", { name: `Profile picture of ${name}` }).getAttribute("src");
  await picker.setInputFiles({ name: "camera.jpg", mimeType: "image/jpeg", buffer: oriented });
  await page.getByRole("button", { name: "Use photo" }).click();
  await expect(page.getByRole("img", { name: `Profile picture of ${name}` })).not.toHaveAttribute("src", previousSrc ?? "");
  await page.goto(`/u/${handle}`);
  const orientedResponse = await page.request.get(await page.getByRole("img", { name: `Profile picture of ${name}` }).getAttribute("src") ?? "");
  expect(orientedResponse.ok()).toBe(true);
  const orientedRaw = await sharp(await orientedResponse.body()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const redTop = ((orientedRaw.info.width * Math.floor(orientedRaw.info.height * 0.2)) + Math.floor(orientedRaw.info.width / 2)) * 3;
  const blueBottom = ((orientedRaw.info.width * Math.floor(orientedRaw.info.height * 0.8)) + Math.floor(orientedRaw.info.width / 2)) * 3;
  expect(orientedRaw.data[redTop]).toBeGreaterThan(orientedRaw.data[redTop + 2]);
  expect(orientedRaw.data[blueBottom + 2]).toBeGreaterThan(orientedRaw.data[blueBottom]);

  // A large phone-sized file must take the canvas path and stay below the browser send cap.
  const large = await sharp(randomBytes(2400 * 1600 * 3), { raw: { width: 2400, height: 1600, channels: 3 } })
    .jpeg({ quality: 100 }).toBuffer();
  expect(large.length).toBeGreaterThan(3.5 * 1024 * 1024);
  await page.goto("/profile");
  const beforeLarge = await page.getByRole("img", { name: `Profile picture of ${name}` }).getAttribute("src");
  await page.evaluate(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (input === "/api/profile-picture" && init?.body instanceof FormData) {
        const image = init.body.get("image");
        if (image instanceof Blob) (window as Window & { photoUploadSize?: number }).photoUploadSize = image.size;
      }
      return originalFetch(input, init);
    };
  });
  await picker.setInputFiles({ name: "large.jpg", mimeType: "image/jpeg", buffer: large });
  const largeRequest = page.waitForRequest((request) => request.url().endsWith("/api/profile-picture") && request.method() === "POST");
  await page.getByRole("button", { name: "Use photo" }).click();
  await largeRequest;
  await expect(page.getByRole("img", { name: `Profile picture of ${name}` })).not.toHaveAttribute("src", beforeLarge ?? "", { timeout: 20_000 });
  const sentBytes = await page.evaluate(() => (window as Window & { photoUploadSize?: number }).photoUploadSize ?? 0);
  expect(sentBytes).toBeGreaterThan(0);
  expect(sentBytes).toBeLessThanOrEqual(3.5 * 1024 * 1024);
});
