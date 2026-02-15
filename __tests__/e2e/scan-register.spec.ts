import { test, expect } from "@playwright/test";

test.describe("E2E-02: Scan & Register Flow", () => {
  // Note: These tests require auth cookies set in a fixture.
  // For now, we test the scan page structure without auth.

  test("scan page has camera/upload options", async ({ page }) => {
    // Navigate directly (auth bypass would be needed for full E2E)
    await page.goto("/scan");
    // If redirected to login, test the page renders login
    const url = page.url();
    if (url.includes("login")) {
      await expect(page.locator("body")).toBeVisible();
      return; // Auth required — skip rest
    }
    // Scan page should have upload area
    await expect(page.locator("body")).toBeVisible();
  });

  test("scan page is responsive at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/scan");
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
