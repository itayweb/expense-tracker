import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth/server";
import { generateRecurringExpenses } from "@/lib/recurringUtils";

/**
 * Backfill recurring expense instances for all past months.
 * The migration deleted recurring=true template rows (which also served as
 * historical records). This endpoint re-generates instances for every month
 * from each template's startDate up to (but not including) the current month.
 */
export async function POST() {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.recurringTemplate.findMany({
    where: { userId },
    select: { startDate: true },
  });

  if (templates.length === 0) {
    return NextResponse.json({ generated: 0, message: "No templates found" });
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Find the earliest startDate across all templates
  const earliestStart = templates.reduce((min, t) =>
    t.startDate < min ? t.startDate : min,
    templates[0].startDate
  );

  const startMonth = earliestStart.getMonth() + 1;
  const startYear = earliestStart.getFullYear();

  let totalGenerated = 0;
  let month = startMonth;
  let year = startYear;

  // Iterate every month from the earliest template start up to (not including) current month
  while (year < currentYear || (year === currentYear && month < currentMonth)) {
    const count = await generateRecurringExpenses(userId, month, year);
    totalGenerated += count;

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return NextResponse.json({
    generated: totalGenerated,
    message: `Backfilled ${totalGenerated} expense instance(s) across past months`,
  });
}
