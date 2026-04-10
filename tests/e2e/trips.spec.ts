import { test, expect } from "@playwright/test";
import { seedBudget } from "./helpers/api";

test.describe("Trips", () => {
  test.beforeEach(async ({ request }) => {
    await seedBudget(request);
  });

  test("create a trip via UI", async ({ page }) => {
    await page.goto("/");

    await page.locator('[data-testid="new-trip-btn"]').click();
    await expect(page.locator('text=New Trip')).toBeVisible();

    await page.fill("#trip-name", "Paris 2026");
    await page.fill("#trip-start", "2026-06-01");
    await page.fill("#trip-end", "2026-06-10");
    await page.locator('[data-testid="create-trip-submit"]').click();

    // Trip appears in the list
    await expect(page.locator('text=Paris 2026')).toBeVisible();
  });

  test("add expense to a trip", async ({ page }) => {
    await page.goto("/");

    // Create trip first
    await page.locator('[data-testid="new-trip-btn"]').click();
    await page.fill("#trip-name", "Tokyo trip");
    await page.locator('[data-testid="create-trip-submit"]').click();

    // Open the trip
    await page.locator('text=Tokyo trip').click();
    await expect(page.locator('button:has-text("Add Expense")')).toBeVisible();

    // Add expense inside the trip
    await page.locator('button:has-text("Add Expense")').click();
    await page.fill("#expense-amount", "250");
    await page.fill("#expense-description", "Hotel night");
    await page.locator('[data-testid="add-expense-submit"]').click();

    // Expense appears in the trip modal
    await expect(page.locator('[data-testid="expense-row"]:has-text("Hotel night")')).toBeVisible();
  });

  test("mark a trip as completed", async ({ page }) => {
    await page.goto("/");

    await page.locator('[data-testid="new-trip-btn"]').click();
    await page.fill("#trip-name", "Weekend getaway");
    await page.locator('[data-testid="create-trip-submit"]').click();

    await page.locator('text=Weekend getaway').click();
    await page.locator('button:has-text("Mark Completed")').click();

    // Trip moves to completed section
    await expect(page.locator('text=Weekend getaway')).not.toBeVisible();
    await page.locator('button:has-text("Show"), button:has-text("completed trip")').first().click();
    await expect(page.locator('text=Weekend getaway')).toBeVisible();
  });

  test("delete a trip", async ({ page }) => {
    await page.goto("/");

    await page.locator('[data-testid="new-trip-btn"]').click();
    await page.fill("#trip-name", "Trip to delete");
    await page.locator('[data-testid="create-trip-submit"]').click();

    await page.locator('text=Trip to delete').click();
    await page.locator('button:has-text("Delete trip")').click();

    await expect(page.locator('text=Trip to delete')).not.toBeVisible();
  });
});
