import { APIRequestContext } from "@playwright/test";

const now = new Date();
export const TEST_MONTH = now.getMonth() + 1;
export const TEST_YEAR = now.getFullYear();

export interface TestBudget {
  id: number;
  month: number;
  year: number;
  categoryId: number;
}

/**
 * Seed a minimal budget for the current month with one "monthly" test category.
 * POST /api/budget already deletes any existing budget for the same month,
 * so this is safe to call in beforeEach — each call starts clean.
 */
export async function seedBudget(request: APIRequestContext): Promise<TestBudget> {
  const budgetRes = await request.post("/api/budget", {
    data: {
      monthlyIncome: 10000,
      month: TEST_MONTH,
      year: TEST_YEAR,
      categories: [
        { name: "Test Category", type: "monthly", budgetAmount: 500, emoji: "🧪" },
      ],
    },
  });
  const budget = await budgetRes.json();

  const fullRes = await request.get(`/api/budget?month=${TEST_MONTH}&year=${TEST_YEAR}`);
  const full = await fullRes.json();
  const category = full.categories.find((c: { isSystem: boolean }) => !c.isSystem);

  return { id: budget.id, month: TEST_MONTH, year: TEST_YEAR, categoryId: category.id };
}

/**
 * Add an expense via API (bypasses UI, used for setup).
 */
export async function addExpense(
  request: APIRequestContext,
  data: {
    amount: number;
    description: string;
    categoryId: number;
    recurring?: boolean;
    recurringInterval?: "weekly" | "monthly";
  }
) {
  const res = await request.post("/api/expenses", {
    data: {
      amount: data.amount,
      description: data.description,
      date: new Date().toISOString(),
      categoryId: data.categoryId,
      recurring: data.recurring ?? false,
      recurringInterval: data.recurringInterval ?? null,
    },
  });
  return res.json();
}
