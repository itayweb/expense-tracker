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
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") ?? String(currentMonth));
    const year = parseInt(searchParams.get("year") ?? String(currentYear));
    const isCurrentMonth = month === currentMonth && year === currentYear;

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

    // Only run side effects for the current month (not for historical month fetches)
    let generated = 0;
    let tripsCreated = false;
    if (isCurrentMonth) {
      // Generate any pending recurring expense entries
      try {
        generated = await generateRecurringExpenses(budget.id, month, year);
      } catch (err) {
        console.error("Recurring generation error (non-fatal):", err);
      }

      // Ensure Trips system category exists (lazy creation for existing budgets)
      const hasTripsCategory = budget.categories.some((c) => c.isSystem);
      if (!hasTripsCategory) {
        await prisma.category.create({
          data: { name: "Trips", type: "monthly", budgetAmount: 0, isSystem: true, budgetId: budget.id },
        });
        tripsCreated = true;
      }
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

  // Carry over recurring expense templates from the previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const previousBudget = await prisma.budget.findUnique({
    where: { userId_month_year: { userId, month: prevMonth, year: prevYear } },
    include: {
      categories: {
        include: {
          expenses: { where: { recurring: true } },
        },
      },
    },
  });

  if (previousBudget) {
    // Map new category names (lowercase) → new category id
    const newCategoryMap = new Map(
      budget.categories.map((c) => [c.name.toLowerCase(), c.id])
    );

    const recurringToSeed: {
      amount: number;
      description: string;
      date: Date;
      categoryId: number;
      recurring: true;
      recurringInterval: string | null;
    }[] = [];

    for (const prevCat of previousBudget.categories) {
      if (prevCat.expenses.length === 0) continue;
      const newCatId = newCategoryMap.get(prevCat.name.toLowerCase());
      if (!newCatId) continue;
      for (const exp of prevCat.expenses) {
        recurringToSeed.push({
          amount: exp.amount,
          description: exp.description,
          date: exp.date, // keep original date (in prev month) so generateRecurringExpenses fires
          categoryId: newCatId,
          recurring: true,
          recurringInterval: exp.recurringInterval,
        });
      }
    }

    if (recurringToSeed.length > 0) {
      await prisma.expense.createMany({ data: recurringToSeed });
    }
  }

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
