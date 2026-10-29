import { expect, type Page } from "@playwright/test";

export async function createProfile(page: Page, suffix: string) {
  await page.goto("/profile");
  const handle = `e2e-${suffix}`;
  await page.getByRole("textbox", { name: "Handle" }).fill(handle);
  await expect(page.locator("#handle-status")).toHaveText(`/u/${handle} is free`, { ignoreCase: true });
  await page.getByRole("textbox", { name: "Name" }).fill(`Editor ${suffix}`);
  await page.getByRole("combobox", { name: "Course" }).selectOption({ label: "BS Computer Science" });
  await page.getByRole("button", { name: "Create my page" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your page");
  return { handle, name: `Editor ${suffix}` };
}
