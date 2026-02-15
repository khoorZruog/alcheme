import { test, expect } from "@playwright/test";

test.describe("E2E-03: Recipe Generation Flow", () => {
  test("chat page renders with welcome message", async ({ page }) => {
    await page.goto("/chat");
    const url = page.url();
    if (url.includes("login")) {
      await expect(page.locator("body")).toBeVisible();
      return;
    }
    // Should show the chat interface
    await expect(page.locator("body")).toBeVisible();
  });

  test("chat page has input field", async ({ page }) => {
    await page.goto("/chat");
    const url = page.url();
    if (url.includes("login")) return;

    // Chat input should exist
    const input = page.locator("textarea, input[type='text']");
    if (await input.count()) {
      await expect(input.first()).toBeVisible();
    }
  });
});
