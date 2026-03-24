import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getWeekBoundaries } from "@/lib/weekUtils";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const month = parseInt(params.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(params.get("year") || String(new Date().getFullYear()));
  const weekNumber = params.get("weekNumber") ? parseInt(params.get("weekNumber")!) : null;
  const categoryId = params.get("categoryId") ? parseInt(params.get("categoryId")!) : null;

  const budget = await prisma.budget.findUnique({
    where: { month_year: { month, year } },
    include: {
      categories: {
        include: {
          expenses: {
            orderBy: { date: "desc" },
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

  let categories = budget.categories;

  // Filter by category if specified
  if (categoryId) {
    categories = categories.filter((c) => c.id === categoryId);
  }

  // Filter expenses by week if specified
  const result = categories.map((cat) => {
    let expenses = cat.expenses;

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
      id: cat.id,
      name: cat.name,
      type: cat.type,
      budgetAmount: cat.budgetAmount,
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
