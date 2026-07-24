import { expect, test } from "@playwright/test";

test("renders the public landing page without horizontal overflow", async ({ page }) => {
  const response = await page.goto("/lp");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/MakersHub/i);
  await expect(page.locator("body")).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("renders login on desktop and mobile", async ({ page }) => {
  const response = await page.goto("/login");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("body")).toContainText(/MakersHub/i);
});
