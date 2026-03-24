import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { computeWeeklyBudget, getWeekBoundaries } from "@/lib/weekUtils";
import { generateRecurringExpenses } from "@/lib/recurringUtils";

export async function GET() {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

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
      return NextResponse.json(null);
    }

    // Generate any pending recurring expense entries
    try {
      await generateRecurringExpenses(budget.id, month, year);
    } catch (err) {
      console.error("Recurring generation error (non-fatal):", err);
    }

    // Re-fetch after generation to include new entries
    const updatedBudget = await prisma.budget.findUnique({
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

    if (!updatedBudget) {
      return NextResponse.json(null);
    }

    const weeksInMonth = getWeekBoundaries(month, year).length;

    const categoriesWithTotals = updatedBudget.categories.map((cat) => {
      const totalSpent = cat.expenses.reduce((sum, exp) => sum + exp.amount, 0);

      if (cat.type === "weekly") {
        const weeklyInfo = computeWeeklyBudget(
          cat.budgetAmount,
          cat.expenses,
          month,
          year
        );
        return {
          ...cat,
          totalSpent,
          weeklyInfo,
        };
      }

      return {
        ...cat,
        totalSpent,
      };
    });

    return NextResponse.json({
      ...updatedBudget,
      categories: categoriesWithTotals,
      weeksInMonth,
    });
  } catch (error) {
    console.error("Budget GET error:", error);
    return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { monthlyIncome, month, year, categories } = body;

  const budget = await prisma.$transaction(async (tx) => {
    // Delete existing budget for this month if it exists
    await tx.budget.deleteMany({
      where: { month, year },
    });

    // Create new budget with categories
    return tx.budget.create({
      data: {
        monthlyIncome,
        month,
        year,
        categories: {
          create: categories.map(
            (cat: { name: string; type: string; budgetAmount: number }) => ({
              name: cat.name,
              type: cat.type,
              budgetAmount: cat.budgetAmount,
            })
          ),
        },
      },
      include: {
        categories: true,
      },
    });
  });

  return NextResponse.json(budget, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { budgetId, monthlyIncome, categories } = body;

  await prisma.$transaction(async (tx) => {
    // Update income
    await tx.budget.update({
      where: { id: budgetId },
      data: { monthlyIncome },
    });

    // Update each category's budget amount
    for (const cat of categories as { id: number; budgetAmount: number }[]) {
      await tx.category.update({
        where: { id: cat.id },
        data: { budgetAmount: cat.budgetAmount },
      });
    }
  });

  const updated = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { categories: true },
  });

  return NextResponse.json(updated);
}
