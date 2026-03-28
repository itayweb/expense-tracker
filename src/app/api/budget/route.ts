import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { computeWeeklyBudget, getWeekBoundaries } from "@/lib/weekUtils";
import { generateRecurringExpenses } from "@/lib/recurringUtils";
import { getAuthedUserId } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await prisma.budget.findUnique({
      where: { userId_month_year: { userId, month, year } },
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
    let generated = 0;
    try {
      generated = await generateRecurringExpenses(budget.id, month, year);
    } catch (err) {
      console.error("Recurring generation error (non-fatal):", err);
    }

    // Ensure Trips system category exists (lazy creation for existing budgets)
    const hasTripsCategory = budget.categories.some((c) => c.isSystem);
    let tripsCreated = false;
    if (!hasTripsCategory) {
      await prisma.category.create({
        data: { name: "Trips", type: "monthly", budgetAmount: 0, isSystem: true, budgetId: budget.id },
      });
      tripsCreated = true;
    }

    // Only re-fetch if new data was created; otherwise reuse the already-loaded budget
    let finalBudget = budget;
    if (generated > 0 || tripsCreated) {
      const updatedBudget = await prisma.budget.findUnique({
        where: { userId_month_year: { userId, month, year } },
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
      if (!updatedBudget) return NextResponse.json(null);
      finalBudget = updatedBudget;
    }

    const weeksInMonth = getWeekBoundaries(month, year).length;

    const categoriesWithTotals = finalBudget.categories.map((cat) => {
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
      ...finalBudget,
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
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { monthlyIncome, month, year, categories } = body;

  const budget = await prisma.$transaction(async (tx) => {
    // Delete existing budget for this month if it exists
    await tx.budget.deleteMany({
      where: { userId, month, year },
    });

    // Create new budget with categories + Trips system category
    return tx.budget.create({
      data: {
        userId,
        monthlyIncome,
        month,
        year,
        categories: {
          create: [
            ...categories.map(
              (cat: { name: string; type: string; budgetAmount: number; emoji?: string }) => ({
                name: cat.name,
                emoji: cat.emoji ?? null,
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
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { budgetId, monthlyIncome, categories, deletedCategoryIds } = body;

  await prisma.$transaction(async (tx) => {
    // Update income
    const updatedBudget = await tx.budget.updateMany({
      where: { id: budgetId, userId },
      data: { monthlyIncome },
    });
    if (updatedBudget.count === 0) {
      throw new Error("Budget not found");
    }

    // Delete removed categories (never delete system categories)
    if (deletedCategoryIds?.length) {
      await tx.category.deleteMany({
        where: { id: { in: deletedCategoryIds }, isSystem: false, budgetId },
      });
    }

    // Update existing or create new categories (skip system categories)
    for (const cat of categories as { id?: number; name: string; type: string; budgetAmount: number; emoji?: string }[]) {
      if (cat.id) {
        const updated = await tx.category.updateMany({
          where: { id: cat.id, budgetId, budget: { userId } },
          data: { budgetAmount: cat.budgetAmount, name: cat.name, type: cat.type, emoji: cat.emoji ?? null },
        });
        if (updated.count === 0) {
          throw new Error("Category not found");
        }
      } else {
        await tx.category.create({
          data: {
            name: cat.name,
            emoji: cat.emoji ?? null,
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

  const updated = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
    include: { categories: true },
  });

  return NextResponse.json(updated);
}
