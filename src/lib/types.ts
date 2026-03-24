export type CategoryType = "weekly" | "monthly";

export interface WizardCategory {
  name: string;
  type: CategoryType;
}

export interface WizardCategoryWithBudget extends WizardCategory {
  budgetAmount: number;
}

export interface WizardData {
  monthlyIncome: number;
  categories: WizardCategoryWithBudget[];
}

export interface BudgetSuggestion {
  name: string;
  type: CategoryType;
  suggestedAmount: number;
}

export interface ExpenseItem {
  id: number;
  amount: number;
  description: string;
  date: string;
  recurring: boolean;
  recurringInterval: string | null;
}

export interface WeeklyInfoData {
  currentWeekNumber: number;
  effectiveBudget: number;
  currentWeekSpent: number;
  totalMonthSpent: number;
  carryOverDebt: number;
  weekBreakdown: {
    weekNumber: number;
    start: string;
    end: string;
    allocated: number;
    spent: number;
    overspend: number;
  }[];
}

export interface CategoryWithExpenses {
  id: number;
  name: string;
  type: string;
  budgetAmount: number;
  budgetId: number;
  expenses: ExpenseItem[];
  totalSpent: number;
  weeklyInfo?: WeeklyInfoData;
}

export interface BudgetWithCategories {
  id: number;
  monthlyIncome: number;
  month: number;
  year: number;
  categories: CategoryWithExpenses[];
  weeksInMonth?: number;
}
