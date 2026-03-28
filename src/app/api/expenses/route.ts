import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categoryId = request.nextUrl.searchParams.get("categoryId");

  const expenses = await prisma.expense.findMany({
    where: categoryId
      ? { categoryId: parseInt(categoryId), category: { budget: { userId } } }
      : { category: { budget: { userId } } },
    include: { trip: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  let categoryId: number = body.categoryId;

  // When adding a trip expense, auto-assign to the Trips system category
  if (body.tripId) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await prisma.budget.findUnique({
      where: { userId_month_year: { userId, month, year } },
      include: { categories: { where: { isSystem: true } } },
    });

    const tripsCategory = budget?.categories[0];
    if (tripsCategory) {
      categoryId = tripsCategory.id;
    }
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, budget: { userId } },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const expense = await prisma.expense.create({
    data: {
      amount: body.amount,
      description: body.description,
      date: body.date ? new Date(body.date) : new Date(),
      categoryId,
      recurring: body.recurring || false,
      recurringInterval: body.recurring ? body.recurringInterval || null : null,
      tripId: body.tripId || null,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
