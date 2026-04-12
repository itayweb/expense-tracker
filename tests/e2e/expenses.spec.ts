import { test, expect } from "@playwright/test";
import { seedBudget, addExpense } from "./helpers/api";

test.describe("One-time expenses", () => {
  test.beforeEach(async ({ page }) => {
    await seedBudget(page.request);
  });

  test("add expense via floating button", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await page.goto("/");

    await page.locator('[data-testid="add-expense-fab"]').click();
    await expect(page.locator('[data-testid="add-expense-form"]')).toBeVisible();

    // Select the test category by its ID value
    await page.locator('[data-testid="expense-category-select"]').selectOption({ value: String(budget.categoryId) });
    await page.fill("#expense-amount", "42.50");
    await page.fill("#expense-description", "Coffee run");
    await page.locator('[data-testid="add-expense-submit"]').click();

    // Modal closes and expense appears
    await expect(page.locator('[data-testid="add-expense-form"]')).not.toBeVisible();

    // Navigate to the category to see the expense
    await page.locator('text=Test Category').click();
    await expect(page.locator('[data-testid="expense-row"]:has-text("Coffee run")')).toBeVisible();
  });

  test("edit an existing expense", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await addExpense(page.request, {
      amount: 100,
      description: "Groceries",
      categoryId: budget.categoryId,
    });

    await page.goto("/");
    await page.locator('text=Test Category').click();

    // Click the expense row to enter edit mode
    await page.locator('[data-testid="expense-row"]:has-text("Groceries")').click();
    await expect(page.locator('[data-testid="expense-edit-row"]')).toBeVisible();

    // Change the description
    await page.fill('[data-testid="edit-description-input"]', "Groceries updated");
    await page.fill('[data-testid="edit-amount-input"]', "85");
    await page.locator('[data-testid="expense-save-btn"]').click();

    // Scope dialog should NOT appear for non-recurring
    await expect(page.locator('[data-testid="scope-dialog"]')).not.toBeVisible();

    // Updated description appears
    await expect(page.locator('[data-testid="expense-row"]:has-text("Groceries updated")')).toBeVisible();
  });

  test("delete an expense", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await addExpense(page.request, {
      amount: 55,
      description: "To delete",
      categoryId: budget.categoryId,
    });

    await page.goto("/");
    await page.locator('text=Test Category').click();

    const row = page.locator('[data-testid="expense-row"]:has-text("To delete")');
    await expect(row).toBeVisible();

    // Hover to reveal delete button, then click
    await row.hover();
    await row.locator('[data-testid="expense-delete-btn"]').click();

    // No scope dialog for non-recurring
    await expect(page.locator('[data-testid="scope-dialog"]')).not.toBeVisible();

    // Expense is gone
    await expect(row).not.toBeVisible();
  });
});
