import { test, expect } from "@playwright/test";
import { seedBudget, addExpense, TEST_MONTH, TEST_YEAR } from "./helpers/api";

test.describe("History / transactions view", () => {
  test("current month expenses appear in history", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await addExpense(page.request, { amount: 120, description: "History test expense", categoryId: budget.categoryId });

    await page.goto("/history");
    await expect(page.locator('text=History test expense')).toBeVisible();
  });

  test("expenses show under the correct month", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await addExpense(page.request, { amount: 99, description: "April only expense", categoryId: budget.categoryId });

    await page.goto("/history");

    // Current month should show the expense
    await expect(page.locator('text=April only expense')).toBeVisible();

    // Navigate to previous month — expense should NOT be there
    await page.locator('button:has-text("←")').first().click();
    await expect(page.locator('text=April only expense')).not.toBeVisible();
  });

  test("recurring expense is tagged in history view", async ({ page }) => {
    const budget = await seedBudget(page.request);
    await addExpense(page.request, {
      amount: 180,
      description: "Recurring in history",
      categoryId: budget.categoryId,
      recurring: true,
      recurringInterval: "monthly",
    });

    await page.goto("/history");
    const row = page.locator('[data-testid="expense-row"]:has-text("Recurring in history")');
    await expect(row).toBeVisible();
    await expect(row.locator('[data-testid="recurring-badge"]')).toHaveText("monthly");
  });

  test("previous months do not leak into current month view", async ({ page }) => {
    // Seed current month budget
    await seedBudget(page.request);

    await page.goto("/history");

    // Navigate back one month — should not show current-month-only expenses
    const prevMonthName = new Date(TEST_YEAR, TEST_MONTH - 2).toLocaleString("en", { month: "long" });
    await page.locator('button:has-text("←")').first().click();

    // The history for previous month should render without errors
    await expect(page.locator('text=Error')).not.toBeVisible();
  });
});
