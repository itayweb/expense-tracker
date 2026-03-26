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

    // Ensure Trips system category exists (lazy creation for existing budgets)
    const hasTripsCategory = budget.categories.some((c) => c.isSystem);
    if (!hasTripsCategory) {
      await prisma.category.create({
        data: { name: "Trips", type: "monthly", budgetAmount: 0, isSystem: true, budgetId: budget.id },
      });
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
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Budget GET error:", message, stack);
    return NextResponse.json({ error: "Failed to fetch budget", detail: message }, { status: 500 });
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

    // Create new budget with categories + Trips system category
    return tx.budget.create({
      data: {
        monthlyIncome,
        month,
        year,
        categories: {
          create: [
            ...categories.map(
              (cat: { name: string; type: string; budgetAmount: number }) => ({
                name: cat.name,
                type: cat.type,
                budgetAmount: cat.budgetAmount,
              })
            ),
            { name: "Trips", type: "monthly", budgetAmount: 0, isSystem: true },
          ],
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

    // Delete removed categories (never delete system categories)
    if (deletedCategoryIds?.length) {
      await tx.category.deleteMany({
        where: { id: { in: deletedCategoryIds }, isSystem: false },
      });
    }

    // Update existing or create new categories (skip system categories)
    for (const cat of categories as { id?: number; name: string; type: string; budgetAmount: number }[]) {
      if (cat.id) {
        await tx.category.update({
          where: { id: cat.id },
          data: { budgetAmount: cat.budgetAmount, name: cat.name, type: cat.type },
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

    // Ensure Trips system category still exists
    const tripsCategory = await tx.category.findFirst({
      where: { budgetId, isSystem: true },
    });
    if (!tripsCategory) {
      await tx.category.create({
        data: { name: "Trips", type: "monthly", budgetAmount: 0, isSystem: true, budgetId },
      });
    }
  });

  const updated = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { categories: true },
  });

  return NextResponse.json(updated);
}
