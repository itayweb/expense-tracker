import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth/server";

/**
 * One-time cleanup: delete unlinked expense instances for the current month
 * that are now covered by a RecurringTemplate. Previous months' expenses are
 * preserved as historical records. The current month's unlinked instances
 * will be re-generated (with recurringTemplateId set) on the next page load.
 */
export async function POST() {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  // Find all templates for this user
  const templates = await prisma.recurringTemplate.findMany({
    where: { userId },
    select: { categoryId: true, description: true, amount: true },
  });

  if (templates.length === 0) {
    return NextResponse.json({ deleted: 0, message: "No templates found" });
  }

  // Delete unlinked instances only within the current month — past months are
  // kept as historical records. The new system will re-generate this month's
  // instances with recurringTemplateId linked.
  let deleted = 0;
  for (const template of templates) {
    const result = await prisma.expense.deleteMany({
      where: {
        recurringTemplateId: null,
        categoryId: template.categoryId,
        description: { equals: template.description, mode: "insensitive" },
        amount: template.amount,
        date: { gte: monthStart, lte: monthEnd },
        category: { userId },
      },
    });
    deleted += result.count;
  }

  return NextResponse.json({ deleted, message: `Cleaned up ${deleted} duplicate expense(s) for ${month}/${year}` });
}
