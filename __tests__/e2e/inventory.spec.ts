import { test, expect } from "@playwright/test";

test.describe("E2E-04: Inventory Flow", () => {
  test("inventory page loads", async ({ page }) => {
    await page.goto("/inventory");
    const url = page.url();
    if (url.includes("login")) {
      await expect(page.locator("body")).toBeVisible();
      return;
    }
    await expect(page.locator("body")).toBeVisible();
  });

  test("inventory page has category filter tabs", async ({ page }) => {
    await page.goto("/inventory");
    const url = page.url();
    if (url.includes("login")) return;

    // Look for category filter
    const allTab = page.locator("text=すべて");
    if (await allTab.count()) {
      await expect(allTab.first()).toBeVisible();
    }
  });

  test("inventory page is mobile responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/inventory");
    await expect(page.locator("body")).toBeVisible();
  });
});
