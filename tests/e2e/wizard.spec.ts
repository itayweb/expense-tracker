import { test, expect } from "@playwright/test";

/**
 * Wizard flow: full UI path for creating a budget.
 * This is the only test that uses the wizard UI — all others seed via API.
 */
test.describe("Budget setup wizard", () => {
  test("creates a budget through the wizard", async ({ page }) => {
    // Start from a state with no budget by going directly to /wizard
    await page.goto("/wizard");
    await expect(page).toHaveURL(/wizard/);

    // Step 1: Income
    await page.fill("#income", "8000");
    await page.click('button:has-text("Next")');

    // Step 2: Categories — default categories are pre-filled
    await expect(page.locator('text=Set up your expense categories')).toBeVisible();

    // Add a custom category
    await page.fill("#new-category", "Pet Food");
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Pet Food')).toBeVisible();

    // Skip AI suggestions by clicking "Get AI Suggestions" then Back, or look for skip
    await page.click('button:has-text("Get AI Suggestions")');

    // Step 3: AI suggestions — wait for it to load or error
    await page.waitForTimeout(2000);

    // Go to review (click "Review" if available, or Back then Next)
    const reviewBtn = page.locator('button:has-text("Review")');
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
    } else {
      // AI step might have a "Retry AI" or direct Continue
      const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Review")').first();
      await continueBtn.click();
    }

    // Step 4: Review & Save
    await expect(page.locator('text=8,000').or(page.locator('text=8000'))).toBeVisible();
    await page.click('button:has-text("Save Budget"), button:has-text("Confirm")');

    // After save, redirect to dashboard (DB write for many categories can take a few seconds)
    await expect(page).toHaveURL("/", { timeout: 15000 });
    await expect(page.locator('[data-testid="add-expense-fab"]')).toBeVisible();
  });
});
