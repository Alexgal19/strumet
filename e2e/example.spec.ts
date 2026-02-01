import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check if the page title is correct
    await expect(page).toHaveTitle(/Baza/);
  });

  test("should navigate to active employees page", async ({ page }) => {
    await page.goto("/");

    // Click on active employees link
    await page.click('a[href="/aktywni"]');

    // Wait for navigation
    await page.waitForURL("**/aktywni");

    // Verify we're on the correct page
    await expect(page).toHaveURL(/\/aktywni/);
  });
});
