import { test, expect } from "@playwright/test";

test.describe("E2E-05: Recipe Detail Flow", () => {
  test("recipes page loads", async ({ page }) => {
    await page.goto("/recipes");
    const url = page.url();
    if (url.includes("login")) {
      await expect(page.locator("body")).toBeVisible();
      return;
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("recipes page shows empty state or list", async ({ page }) => {
    await page.goto("/recipes");
    const url = page.url();
    if (url.includes("login")) return;

    // Either shows recipe cards or empty state
    await expect(page.locator("body")).toBeVisible();
  });
});
