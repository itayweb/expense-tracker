export interface WeekBoundary {
  weekNumber: number;
  start: Date;
  end: Date;
}

export interface WeekBreakdown {
  weekNumber: number;
  start: string;
  end: string;
  allocated: number;
  spent: number;
  overspend: number;
}

export interface WeeklyBudgetInfo {
  currentWeekNumber: number;
  effectiveBudget: number;
  currentWeekSpent: number;
  totalMonthSpent: number;
  carryOverDebt: number;
  weekBreakdown: WeekBreakdown[];
}

/**
 * Get all week boundaries (Sunday-Saturday) for a given month.
 * Partial first/last weeks are included.
 */
export function getWeekBoundaries(month: number, year: number): WeekBoundary[] {
  const weeks: WeekBoundary[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // last day of month

  let weekStart = new Date(firstDay);
  let weekNumber = 1;

  while (weekStart <= lastDay) {
    // Find end of this week (Saturday) or end of month
    const dayOfWeek = weekStart.getDay(); // 0=Sun
    const daysUntilSat = 6 - dayOfWeek;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + daysUntilSat);

    // Cap at end of month
    const effectiveEnd = weekEnd > lastDay ? new Date(lastDay) : weekEnd;

    // Set end to end of day
    effectiveEnd.setHours(23, 59, 59, 999);

    weeks.push({
      weekNumber,
      start: new Date(weekStart),
      end: effectiveEnd,
    });

    // Next week starts on Sunday after this week's Saturday
    weekStart = new Date(effectiveEnd);
    weekStart.setDate(effectiveEnd.getDate() + 1);
    weekStart.setHours(0, 0, 0, 0);
    weekNumber++;
  }

  return weeks;
}

/**
 * Get the current week number for today within a given month.
 * Returns 0 if today is not in the given month.
 */
export function getCurrentWeekNumber(month: number, year: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (today.getMonth() + 1 !== month || today.getFullYear() !== year) {
    return 0;
  }

  const weeks = getWeekBoundaries(month, year);
  for (const week of weeks) {
    const startDay = new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate());
    const endDay = new Date(week.end.getFullYear(), week.end.getMonth(), week.end.getDate());
    if (today >= startDay && today <= endDay) {
      return week.weekNumber;
    }
  }

  return weeks.length;
}

/**
 * Compute weekly budget info with carry-over debt.
 * Only overspending carries forward (not savings).
 */
export function computeWeeklyBudget(
  weeklyAmount: number,
  expenses: { amount: number; date: Date | string }[],
  month: number,
  year: number
): WeeklyBudgetInfo {
  const weeks = getWeekBoundaries(month, year);
  const currentWeekNumber = getCurrentWeekNumber(month, year) || weeks.length;

  let carryOverDebt = 0;
  let totalMonthSpent = 0;
  const weekBreakdown: WeekBreakdown[] = [];

  for (const week of weeks) {
    const weekExpenses = expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      const expDay = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
      const startDay = new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate());
      const endDay = new Date(week.end.getFullYear(), week.end.getMonth(), week.end.getDate());
      return expDay >= startDay && expDay <= endDay;
    });

    const spent = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    totalMonthSpent += spent;

    const overspend = Math.max(0, spent - weeklyAmount);

    weekBreakdown.push({
      weekNumber: week.weekNumber,
      start: week.start.toISOString(),
      end: week.end.toISOString(),
      allocated: weeklyAmount,
      spent,
      overspend,
    });

    // Only accumulate debt from past weeks (not current)
    if (week.weekNumber < currentWeekNumber) {
      carryOverDebt += overspend;
    }
  }

  const currentWeek = weekBreakdown.find((w) => w.weekNumber === currentWeekNumber);
  const effectiveBudget = Math.max(0, weeklyAmount - carryOverDebt);
  const currentWeekSpent = currentWeek?.spent || 0;

  return {
    currentWeekNumber,
    effectiveBudget,
    currentWeekSpent,
    totalMonthSpent,
    carryOverDebt,
    weekBreakdown,
  };
}
