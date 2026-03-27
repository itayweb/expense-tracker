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
) : Promise<number> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const weeks = getWeekBoundaries(month, year);

  const recurringSources = await prisma.expense.findMany({
    where: {
      recurring: true,
      category: { budgetId },
    },
    select: {
      id: true,
      amount: true,
      description: true,
      date: true,
      recurringInterval: true,
      categoryId: true,
    },
  });

  if (recurringSources.length === 0) return 0;

  const existingInMonth = await prisma.expense.findMany({
    where: {
      category: { budgetId },
      date: { gte: monthStart, lte: monthEnd },
    },
    select: {
      categoryId: true,
      description: true,
      amount: true,
      date: true,
      recurring: true,
    },
  });

  const keyOf = (e: { categoryId: number; description: string; amount: number }) =>
    `${e.categoryId}::${e.description}::${e.amount}`;

  const existingNonRecurringKeys = new Set(
    existingInMonth.filter((e) => !e.recurring).map((e) => keyOf(e))
  );

  const existingByKeyAll: Map<string, Date[]> = new Map();
  for (const e of existingInMonth) {
    const k = keyOf(e);
    const list = existingByKeyAll.get(k);
    if (list) list.push(new Date(e.date));
    else existingByKeyAll.set(k, [new Date(e.date)]);
  }

  const toCreate: { amount: number; description: string; date: Date; categoryId: number; recurring: false }[] = [];
  const createKeySet = new Set<string>();

  for (const src of recurringSources) {
    const interval = src.recurringInterval;
    if (interval !== "monthly" && interval !== "weekly") continue;

    const k = keyOf(src);
    const srcDate = new Date(src.date);
    const srcInThisMonth = srcDate >= monthStart && srcDate <= monthEnd;

    if (interval === "monthly") {
      // Create one entry at month start only if:
      // - a non-recurring duplicate doesn't already exist this month
      // - and the source itself isn't dated within this month
      if (!existingNonRecurringKeys.has(k) && !srcInThisMonth) {
        const createK = `${k}::${monthStart.toISOString()}`;
        if (!createKeySet.has(createK)) {
          createKeySet.add(createK);
          toCreate.push({
            amount: src.amount,
            description: src.description,
            date: monthStart,
            categoryId: src.categoryId,
            recurring: false,
          });
        }
      }
      continue;
    }

    // weekly
    const dates = existingByKeyAll.get(k) ?? [];
    for (const week of weeks) {
      const hasEntryThisWeek = dates.some((d) => d >= week.start && d <= week.end);
      if (!hasEntryThisWeek) {
        const createK = `${k}::${week.start.toISOString()}`;
        if (!createKeySet.has(createK)) {
          createKeySet.add(createK);
          toCreate.push({
            amount: src.amount,
            description: src.description,
            date: week.start,
            categoryId: src.categoryId,
            recurring: false,
          });
        }
      }
    }
  }

  if (toCreate.length === 0) return 0;

  const result = await prisma.expense.createMany({
    data: toCreate,
  });

  return result.count;
}
