import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { computeWeeklyBudget, getWeekBoundaries } from "@/lib/weekUtils";
import { generateRecurringExpenses } from "@/lib/recurringUtils";
import { getAuthedUserId } from "@/lib/auth/server";

async function fetchBudget(userId: string, month: number, year: number) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  return prisma.budget.findUnique({
    where: { userId_month_year: { userId, month, year } },
    include: {
      budgetCategories: {
        include: {
          category: {
            include: {
              expenses: {
                where: { date: { gte: monthStart, lte: monthEnd } },
                include: { trip: { select: { id: true, name: true } } },
                orderBy: { date: "desc" },
              },
            },
          },
        },
      },
    },
  });
}

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

    const budget = await fetchBudget(userId, month, year);

    if (!budget) {
      return NextResponse.json(null);
    }

    let generated = 0;
    let needsRefetch = false;

    if (isCurrentMonth) {
      try {
        generated = await generateRecurringExpenses(userId, month, year);
        if (generated > 0) needsRefetch = true;
      } catch (err) {
        console.error("Recurring generation error (non-fatal):", err);
      }

      // Ensure Trips system category exists for this user
      let tripsCategory = await prisma.category.findFirst({
        where: { userId, isSystem: true },
      });
      if (!tripsCategory) {
        tripsCategory = await prisma.category.create({
          data: { userId, name: "Trips", type: "monthly", isSystem: true },
        });
        needsRefetch = true;
      }

      // Ensure BudgetCategory row exists for Trips in this budget
      const hasTripsBC = budget.budgetCategories.some((bc) => bc.category.isSystem);
      if (!hasTripsBC) {
        await prisma.budgetCategory.upsert({
          where: { budgetId_categoryId: { budgetId: budget.id, categoryId: tripsCategory.id } },
          update: {},
          create: { budgetId: budget.id, categoryId: tripsCategory.id, budgetAmount: 0 },
        });
        needsRefetch = true;
      }
    }

    const finalBudget = needsRefetch ? await fetchBudget(userId, month, year) : budget;
    if (!finalBudget) return NextResponse.json(null);

    const weeksInMonth = getWeekBoundaries(month, year).length;

    const categoriesWithTotals = finalBudget.budgetCategories.map((bc) => {
      const expenses = bc.category.expenses.map((exp) => {
        const { trip, ...rest } = exp as typeof exp & { trip?: { id: number; name: string } | null };
        return {
          ...rest,
          tripId: trip?.id ?? null,
          tripName: trip?.name ?? null,
        };
      });

      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const cat = {
        ...bc.category,
        budgetAmount: bc.budgetAmount,
        expenses,
        totalSpent,
      };

      if (bc.category.type === "weekly") {
        const weeklyInfo = computeWeeklyBudget(bc.budgetAmount, expenses, month, year);
        return { ...cat, weeklyInfo };
      }

      return cat;
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
  try {
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { monthlyIncome, month, year, categories } = body;

    // Delete existing budget for this month if it exists
    await prisma.budget.deleteMany({ where: { userId, month, year } });

    const budget = await prisma.budget.create({
      data: { userId, monthlyIncome, month, year },
    });

    // Upsert user-level categories
    const categoryRows: { id: number; budgetAmount: number }[] = [];
    for (const cat of categories as { name: string; type: string; budgetAmount: number; emoji?: string }[]) {
      let existing = await prisma.category.findFirst({
        where: { userId, name: { equals: cat.name, mode: "insensitive" } },
      });
      if (!existing) {
        existing = await prisma.category.create({
          data: { userId, name: cat.name, type: cat.type, emoji: cat.emoji ?? null },
        });
      } else {
        existing = await prisma.category.update({
          where: { id: existing.id },
          data: { type: cat.type, emoji: cat.emoji ?? null },
        });
      }
      categoryRows.push({ id: existing.id, budgetAmount: cat.budgetAmount });
    }

    // Ensure Trips system category exists
    let tripsCategory = await prisma.category.findFirst({ where: { userId, isSystem: true } });
    if (!tripsCategory) {
      tripsCategory = await prisma.category.create({
        data: { userId, name: "Trips", type: "monthly", isSystem: true },
      });
    }

    await prisma.budgetCategory.createMany({
      data: [
        ...categoryRows.map(({ id, budgetAmount }) => ({
          budgetId: budget.id,
          categoryId: id,
          budgetAmount,
        })),
        { budgetId: budget.id, categoryId: tripsCategory.id, budgetAmount: 0 },
      ],
      skipDuplicates: true,
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Budget POST error:", message, stack);
    return NextResponse.json({ error: "Failed to create budget", detail: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { budgetId, monthlyIncome, categories, deletedCategoryIds } = body;

  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
  if (!budget) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.budget.update({ where: { id: budgetId }, data: { monthlyIncome } });

    if (deletedCategoryIds?.length) {
      const monthStart = new Date(budget.year, budget.month - 1, 1);
      const monthEnd = new Date(budget.year, budget.month, 0, 23, 59, 59, 999);
      await tx.expense.deleteMany({
        where: {
          categoryId: { in: deletedCategoryIds },
          category: { userId, isSystem: false },
          date: { gte: monthStart, lte: monthEnd },
        },
      });
      await tx.budgetCategory.deleteMany({
        where: {
          budgetId,
          categoryId: { in: deletedCategoryIds },
          category: { isSystem: false, userId },
        },
      });
    }

    for (const cat of categories as { id?: number; name: string; type: string; budgetAmount: number; emoji?: string }[]) {
      if (cat.id) {
        await tx.category.updateMany({
          where: { id: cat.id, userId },
          data: { name: cat.name, type: cat.type, emoji: cat.emoji ?? null },
        });
        await tx.budgetCategory.updateMany({
          where: { budgetId, categoryId: cat.id },
          data: { budgetAmount: cat.budgetAmount },
        });
      } else {
        let category = await tx.category.findFirst({
          where: { userId, name: { equals: cat.name, mode: "insensitive" } },
        });
        if (!category) {
          category = await tx.category.create({
            data: { userId, name: cat.name, type: cat.type, emoji: cat.emoji ?? null },
          });
        }
        await tx.budgetCategory.upsert({
          where: { budgetId_categoryId: { budgetId, categoryId: category.id } },
          update: { budgetAmount: cat.budgetAmount },
          create: { budgetId, categoryId: category.id, budgetAmount: cat.budgetAmount },
        });
      }
    }

    // Ensure Trips system category still exists and has a BudgetCategory
    let tripsCategory = await tx.category.findFirst({ where: { userId, isSystem: true } });
    if (!tripsCategory) {
      tripsCategory = await tx.category.create({
        data: { userId, name: "Trips", type: "monthly", isSystem: true },
      });
    }
    await tx.budgetCategory.upsert({
      where: { budgetId_categoryId: { budgetId, categoryId: tripsCategory.id } },
      update: {},
      create: { budgetId, categoryId: tripsCategory.id, budgetAmount: 0 },
    });
  });

  const updated = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
    include: { budgetCategories: { include: { category: true } } },
  });

  return NextResponse.json(updated);
}
