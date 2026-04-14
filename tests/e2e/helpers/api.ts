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
 * Cleans up all expenses and recurring templates from previous runs first.
 */
export async function seedBudget(request: APIRequestContext): Promise<TestBudget> {
  // Clean up expenses (and recurring templates) left over from previous runs.
  // scope=future on a recurring expense also deletes the template, preventing re-generation.
  // Run in parallel to avoid hitting the 30s test timeout.
  const existingRes = await request.get(`/api/budget?month=${TEST_MONTH}&year=${TEST_YEAR}`);
  if (existingRes.ok()) {
    const existing = await existingRes.json();
    const expenseIds: number[] = (existing?.categories ?? []).flatMap(
      (cat: { expenses?: { id: number }[] }) => (cat.expenses ?? []).map((exp) => exp.id)
    );
    // Sequential to avoid concurrent scope=future deletes racing on the same template
    for (const id of expenseIds) {
      await request.delete(`/api/expenses/${id}?scope=future`);
    }
  }

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
  if (!budgetRes.ok()) {
    throw new Error(`POST /api/budget failed ${budgetRes.status()}: ${await budgetRes.text()}`);
  }
  const budget = await budgetRes.json();

  const fullRes = await request.get(`/api/budget?month=${TEST_MONTH}&year=${TEST_YEAR}`);
  const full = await fullRes.json();
  if (!full?.categories) {
    throw new Error(`GET /api/budget returned unexpected: ${JSON.stringify(full)}`);
  }
  const category = full.categories.find((c: { isSystem: boolean }) => !c.isSystem);

  return { id: budget.id, month: TEST_MONTH, year: TEST_YEAR, categoryId: category.id };
}

/**
 * Delete all trips for the test user. Call in beforeEach for trip tests
 * so accumulated trips from previous runs don't bleed into assertions.
 */
export async function deleteAllTrips(request: APIRequestContext): Promise<void> {
  const res = await request.get("/api/trips");
  if (!res.ok()) return;
  const trips = await res.json();
  for (const trip of trips) {
    await request.delete(`/api/trips/${trip.id}`);
  }
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
