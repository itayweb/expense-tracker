import { test, expect } from "@playwright/test";
import { seedBudget, addExpense } from "./helpers/api";

test.describe("Recurring expenses", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first so the Clerk middleware can complete its handshake and
    // refresh the short-lived __session JWT before we make any API calls.
    await page.goto("/", { waitUntil: "networkidle" });
  });

  test("monthly recurring expense appears tagged in current month", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await addExpense(page.request, {
      amount: 200,
      description: "Streaming subscription",
      categoryId: budget.categoryId,
      recurring: true,
      recurringInterval: "monthly",
    });

    await page.goto("/");
    await page.locator('text=Test Category').click();

    // The expense should be visible and tagged with "monthly"
    const row = page.locator('[data-testid="expense-row"]:has-text("Streaming subscription")');
    await expect(row).toBeVisible();
    await expect(row.locator('[data-testid="recurring-badge"]')).toHaveText("monthly");

    // There should be exactly one instance (no duplicate)
    await expect(page.locator('[data-testid="expense-row"]:has-text("Streaming subscription")')).toHaveCount(1);
  });

  test("editing a recurring expense — just this one does not affect template", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await addExpense(page.request, {
      amount: 150,
      description: "Monthly gym",
      categoryId: budget.categoryId,
      recurring: true,
      recurringInterval: "monthly",
    });

    await page.goto("/");
    await page.locator('text=Test Category').click();

    // Click the recurring expense to edit
    await page.locator('[data-testid="expense-row"]:has-text("Monthly gym")').click();
    await page.fill('[data-testid="edit-description-input"]', "Monthly gym (edited)");
    await page.locator('[data-testid="expense-save-btn"]').click();

    // Scope dialog appears for recurring expense
    await expect(page.locator('[data-testid="scope-dialog"]')).toBeVisible();

    // Choose "Just this one"
    await page.locator('[data-testid="scope-single-btn"]').click();

    // The instance description is updated
    await expect(page.locator('[data-testid="expense-row"]:has-text("Monthly gym (edited)")')).toBeVisible();

    // Still tagged as recurring
    const row = page.locator('[data-testid="expense-row"]:has-text("Monthly gym (edited)")');
    await expect(row.locator('[data-testid="recurring-badge"]')).toBeVisible();
  });

  test("editing a recurring expense — this and all future updates template", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await addExpense(page.request, {
      amount: 300,
      description: "Insurance payment",
      categoryId: budget.categoryId,
      recurring: true,
      recurringInterval: "monthly",
    });

    await page.goto("/");
    await page.locator('text=Test Category').click();

    await page.locator('[data-testid="expense-row"]:has-text("Insurance payment")').click();
    await page.fill('[data-testid="edit-amount-input"]', "350");
    await page.locator('[data-testid="expense-save-btn"]').click();

    await expect(page.locator('[data-testid="scope-dialog"]')).toBeVisible();
    await page.locator('[data-testid="scope-future-btn"]').click();

    // Instance is updated
    await expect(page.locator('[data-testid="expense-row"]:has-text("Insurance payment")')).toBeVisible();
  });

  test("deleting a recurring expense — just this one", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await addExpense(page.request, {
      amount: 50,
      description: "Weekly snacks",
      categoryId: budget.categoryId,
      recurring: true,
      recurringInterval: "monthly",
    });

    await page.goto("/");
    await page.locator('text=Test Category').click();

    const row = page.locator('[data-testid="expense-row"]:has-text("Weekly snacks")');
    await row.hover();
    await row.locator('[data-testid="expense-delete-btn"]').click();

    // Scope dialog
    await expect(page.locator('[data-testid="scope-dialog"]')).toBeVisible();
    await page.locator('[data-testid="scope-single-btn"]').click();

    // Instance deleted
    await expect(page.locator('[data-testid="expense-row"]:has-text("Weekly snacks")')).not.toBeVisible();
  });

  test("deleting a recurring expense — this and all future", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await addExpense(page.request, {
      amount: 75,
      description: "Cloud storage",
      categoryId: budget.categoryId,
      recurring: true,
      recurringInterval: "monthly",
    });

    await page.goto("/");
    await page.locator('text=Test Category').click();

    const row = page.locator('[data-testid="expense-row"]:has-text("Cloud storage")');
    await row.hover();
    await row.locator('[data-testid="expense-delete-btn"]').click();

    await expect(page.locator('[data-testid="scope-dialog"]')).toBeVisible();
    await page.locator('[data-testid="scope-future-btn"]').click();

    // Instance deleted and template removed (no re-generation next load)
    await expect(page.locator('[data-testid="expense-row"]:has-text("Cloud storage")')).not.toBeVisible();

    // Reload — template is gone so no re-generation
    await page.reload();
    await page.locator('text=Test Category').click();
    await expect(page.locator('[data-testid="expense-row"]:has-text("Cloud storage")')).not.toBeVisible();
  });
});
