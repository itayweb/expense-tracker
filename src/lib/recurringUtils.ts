import { prisma } from "./prisma";
import { getWeekBoundaries } from "./weekUtils";

/**
 * Generate recurring expense instances for the current month from RecurringTemplates.
 * Idempotent — safe to call multiple times.
 */
export async function generateRecurringExpenses(
  userId: string,
  month: number,
  year: number
): Promise<number> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  const weeks = getWeekBoundaries(month, year);

  const templates = await prisma.recurringTemplate.findMany({
    where: { userId },
  });

  if (templates.length === 0) return 0;

  // Fetch all existing instances for these templates in this month
  const existingInstances = await prisma.expense.findMany({
    where: {
      recurringTemplateId: { in: templates.map((t) => t.id) },
      date: { gte: monthStart, lte: monthEnd },
    },
    select: { recurringTemplateId: true, date: true },
  });

  const toCreate: {
    amount: number;
    description: string;
    date: Date;
    categoryId: number;
    recurring: false;
    recurringInterval: string;
    recurringTemplateId: number;
  }[] = [];

  for (const template of templates) {
    const instancesForTemplate = existingInstances.filter(
      (e) => e.recurringTemplateId === template.id
    );

    if (template.recurringInterval === "monthly") {
      if (instancesForTemplate.length === 0) {
        toCreate.push({
          amount: template.amount,
          description: template.description,
          date: monthStart,
          categoryId: template.categoryId,
          recurring: false,
          recurringInterval: template.recurringInterval,
          recurringTemplateId: template.id,
        });
      }
    } else if (template.recurringInterval === "weekly") {
      for (const week of weeks) {
        const hasEntryThisWeek = instancesForTemplate.some((e) => {
          const d = new Date(e.date);
          return d >= week.start && d <= week.end;
        });
        if (!hasEntryThisWeek) {
          toCreate.push({
            amount: template.amount,
            description: template.description,
            date: week.start,
            categoryId: template.categoryId,
            recurring: false,
            recurringInterval: template.recurringInterval,
            recurringTemplateId: template.id,
          });
        }
      }
    }
  }

  if (toCreate.length === 0) return 0;

  const result = await prisma.expense.createMany({ data: toCreate });
  return result.count;
}
