import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getWeekBoundaries } from "@/lib/weekUtils";
import { getAuthedUserId } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const month = parseInt(params.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(params.get("year") || String(new Date().getFullYear()));
  const weekNumber = params.get("weekNumber") ? parseInt(params.get("weekNumber")!) : null;
  const categoryId = params.get("categoryId") ? parseInt(params.get("categoryId")!) : null;

  const budget = await prisma.budget.findUnique({
    where: { userId_month_year: { userId, month, year } },
    include: {
      budgetCategories: {
        include: {
          category: {
            include: {
              expenses: { orderBy: { date: "desc" } },
            },
          },
        },
      },
    },
  });

  if (!budget) {
    return NextResponse.json({ budget: null, categories: [], weeks: [] });
  }

  const weeks = getWeekBoundaries(month, year).map((w) => ({
    weekNumber: w.weekNumber,
    start: w.start.toISOString(),
    end: w.end.toISOString(),
  }));

  let budgetCategories = budget.budgetCategories;

  if (categoryId) {
    budgetCategories = budgetCategories.filter((bc) => bc.category.id === categoryId);
  }

  const result = budgetCategories.map((bc) => {
    let expenses = bc.category.expenses;

    if (weekNumber !== null) {
      const week = weeks.find((w) => w.weekNumber === weekNumber);
      if (week) {
        const weekStart = new Date(week.start);
        const weekEnd = new Date(week.end);
        expenses = expenses.filter((exp) => {
          const d = new Date(exp.date);
          return d >= weekStart && d <= weekEnd;
        });
      }
    }

    return {
      id: bc.category.id,
      name: bc.category.name,
      emoji: bc.category.emoji,
      type: bc.category.type,
      budgetAmount: bc.budgetAmount,
      isSystem: bc.category.isSystem,
      expenses,
      totalSpent: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    };
  });

  return NextResponse.json({
    budget: {
      id: budget.id,
      monthlyIncome: budget.monthlyIncome,
      month: budget.month,
      year: budget.year,
    },
    categories: result,
    weeks,
  });
}
