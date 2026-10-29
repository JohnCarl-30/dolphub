import { expect, test } from "@playwright/test";
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
  await expect(page.getByRole("img", { name: `Profile picture of ${name}` })).toBeVisible();

  await page.goto(`/u/${handle}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByText("Building useful campus tools.")).toBeVisible();
  await expect(page.getByRole("link", { name: `Email ${name}` })).toHaveAttribute("href", "mailto:public@example.com");
  const robots = await page.locator('meta[name="robots"]').evaluateAll((tags) => tags.map((tag) => tag.getAttribute("content")));
  expect(robots.some((content) => content?.includes("noindex"))).toBe(true);
});
