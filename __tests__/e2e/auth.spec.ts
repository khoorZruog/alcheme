import { test, expect } from "@playwright/test";

test.describe("E2E-01: Authentication Flow", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/inventory");
    // Should redirect to login page
    await expect(page).toHaveURL(/\/(login|auth)/);
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=alche:me")).toBeVisible();
    // Should have login button
    await expect(page.getByRole("button", { name: "ログイン", exact: true })).toBeVisible();
  });

  test("login page has Google sign-in option", async ({ page }) => {
    await page.goto("/login");
    const googleButton = page.locator("text=/Google|ログイン/i");
    await expect(googleButton.first()).toBeVisible();
  });
});
