import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId");

  const expenses = await prisma.expense.findMany({
    where: categoryId ? { categoryId: parseInt(categoryId) } : undefined,
    include: { trip: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  let categoryId: number = body.categoryId;

  // When adding a trip expense, auto-assign to the Trips system category
  if (body.tripId) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await prisma.budget.findUnique({
      where: { month_year: { month, year } },
      include: { categories: { where: { isSystem: true } } },
    });

    const tripsCategory = budget?.categories[0];
    if (tripsCategory) {
      categoryId = tripsCategory.id;
    }
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
