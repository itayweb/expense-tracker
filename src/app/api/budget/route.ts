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
              include: { trip: { select: { id: true, name: true } } },
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
              include: { trip: { select: { id: true, name: true } } },
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
      // Flatten trip data on expenses
      const expenses = cat.expenses.map((exp) => {
        const { trip, ...rest } = exp as typeof exp & { trip?: { id: number; name: string } | null };
        return {
          ...rest,
          tripId: trip?.id ?? null,
          tripName: trip?.name ?? null,
        };
      });

      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      if (cat.type === "weekly") {
        const weeklyInfo = computeWeeklyBudget(
          cat.budgetAmount,
          expenses,
          month,
          year
        );
        return {
          ...cat,
          expenses,
          totalSpent,
          weeklyInfo,
        };
      }

      return {
        ...cat,
        expenses,
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
  const { budgetId, monthlyIncome, categories, deletedCategoryIds } = body;

  await prisma.$transaction(async (tx) => {
    // Update income
    await tx.budget.update({
      where: { id: budgetId },
      data: { monthlyIncome },
    });

    // Delete removed categories
    if (deletedCategoryIds?.length) {
      await tx.category.deleteMany({
        where: { id: { in: deletedCategoryIds } },
      });
    }

    // Update existing or create new categories
    for (const cat of categories as { id?: number; name: string; type: string; budgetAmount: number }[]) {
      if (cat.id) {
        await tx.category.update({
          where: { id: cat.id },
          data: { budgetAmount: cat.budgetAmount },
        });
      } else {
        await tx.category.create({
          data: {
            name: cat.name,
            type: cat.type,
            budgetAmount: cat.budgetAmount,
            budgetId,
          },
        });
      }
    }
  });

  const updated = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { categories: true },
  });

  return NextResponse.json(updated);
}
