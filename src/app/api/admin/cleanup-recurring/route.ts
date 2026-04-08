import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth/server";

/**
 * One-time cleanup: delete unlinked expense instances that are now covered
 * by a RecurringTemplate. These are pre-migration generated copies that
 * lack recurringTemplateId and recurringInterval.
 */
export async function POST() {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all templates for this user
  const templates = await prisma.recurringTemplate.findMany({
    where: { userId },
    select: { categoryId: true, description: true, amount: true },
  });

  if (templates.length === 0) {
    return NextResponse.json({ deleted: 0, message: "No templates found" });
  }

  // Delete unlinked expenses that match any template by (categoryId, description, amount)
  let deleted = 0;
  for (const template of templates) {
    const result = await prisma.expense.deleteMany({
      where: {
        recurringTemplateId: null,
        recurringInterval: null,
        recurring: false,
        categoryId: template.categoryId,
        description: { equals: template.description, mode: "insensitive" },
        amount: template.amount,
        category: { userId },
      },
    });
    deleted += result.count;
  }

  return NextResponse.json({ deleted, message: `Cleaned up ${deleted} duplicate expense(s)` });
}
