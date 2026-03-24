import { prisma } from "./prisma";
import { getWeekBoundaries } from "./weekUtils";

/**
 * Lazily generate recurring expense entries for the current month.
 * Idempotent — safe to call multiple times.
 */
export async function generateRecurringExpenses(
  budgetId: number,
  month: number,
  year: number
) {
  // Find all recurring expenses in this budget's categories
  const categories = await prisma.category.findMany({
    where: { budgetId },
    include: {
      expenses: {
        where: { recurring: true },
      },
    },
  });

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const weeks = getWeekBoundaries(month, year);

  for (const category of categories) {
    for (const recurringExp of category.expenses) {
      if (recurringExp.recurringInterval === "monthly") {
        await generateMonthlyEntry(recurringExp, category.id, monthStart, monthEnd);
      } else if (recurringExp.recurringInterval === "weekly") {
        await generateWeeklyEntries(recurringExp, category.id, weeks, monthStart, monthEnd);
      }
    }
  }
}

async function generateMonthlyEntry(
  source: { id: number; amount: number; description: string },
  categoryId: number,
  monthStart: Date,
  monthEnd: Date
) {
  // Check if a matching entry already exists this month (excluding the source itself)
  const existing = await prisma.expense.findFirst({
    where: {
      categoryId,
      description: source.description,
      amount: source.amount,
      recurring: false,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  if (!existing) {
    const sourceExp = await prisma.expense.findUnique({ where: { id: source.id } });
    if (!sourceExp) return;

    const sourceDate = new Date(sourceExp.date);
    const sourceInThisMonth = sourceDate >= monthStart && sourceDate <= monthEnd;

    if (!sourceInThisMonth) {
      await prisma.expense.create({
        data: {
          amount: source.amount,
          description: source.description,
          date: monthStart,
          categoryId,
          recurring: false,
        },
      });
    }
  }
}

async function generateWeeklyEntries(
  source: { id: number; amount: number; description: string },
  categoryId: number,
  weeks: { weekNumber: number; start: Date; end: Date }[],
  monthStart: Date,
  monthEnd: Date
) {
  const existingExpenses = await prisma.expense.findMany({
    where: {
      categoryId,
      description: source.description,
      amount: source.amount,
      date: { gte: monthStart, lte: monthEnd },
    },
  });

  for (const week of weeks) {
    const hasEntryThisWeek = existingExpenses.some((exp) => {
      const expDate = new Date(exp.date);
      return expDate >= week.start && expDate <= week.end;
    });

    if (!hasEntryThisWeek) {
      await prisma.expense.create({
        data: {
          amount: source.amount,
          description: source.description,
          date: week.start,
          categoryId,
          recurring: false,
        },
      });
    }
  }
}
