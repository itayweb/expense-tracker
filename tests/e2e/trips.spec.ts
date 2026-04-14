import { test, expect } from "@playwright/test";
import { seedBudget, deleteAllTrips } from "./helpers/api";

test.describe("Trips", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await deleteAllTrips(page.request);
    await seedBudget(page.request);
  });

  test("create a trip via UI", async ({ page }) => {
    await page.goto("/");

    await page.locator('[data-testid="new-trip-btn"]').click();
    // Use heading role to avoid matching the "+ New Trip" button text
    await expect(page.getByRole('heading', { name: 'New Trip' })).toBeVisible();

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

    // Wait for the modal to close (heading disappears after PUT resolves)
    await expect(page.getByRole('heading', { name: 'Weekend getaway' })).not.toBeVisible({ timeout: 15000 });
    // Trip card should also be gone from the active list
    await expect(page.locator('p:has-text("Weekend getaway")')).not.toBeVisible();
    // Reveal completed trips and verify it moved there
    await page.locator('button:has-text("Show"), button:has-text("completed trip")').first().click();
    await expect(page.locator('text=Weekend getaway')).toBeVisible();
  });

  test("delete a trip", async ({ page }) => {
    await page.goto("/");

    await page.locator('[data-testid="new-trip-btn"]').click();
    await page.fill("#trip-name", "Trip to delete");
    await page.locator('[data-testid="create-trip-submit"]').click();

    await page.locator('text=Trip to delete').click();
    // First click shows the confirm button; second click actually deletes
    await page.locator('button:has-text("Delete trip")').click();
    await page.locator('button:has-text("Confirm delete")').click();

    // Wait for modal to close then verify trip is gone
    await expect(page.getByRole('heading', { name: 'Trip to delete' })).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('p:has-text("Trip to delete")')).not.toBeVisible();
  });
});
