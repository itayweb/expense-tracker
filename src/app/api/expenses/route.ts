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
      ? { categoryId: parseInt(categoryId), category: { userId } }
      : { category: { userId } },
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
    const tripsCategory = await prisma.category.findFirst({
      where: { userId, isSystem: true },
    });
    if (tripsCategory) {
      categoryId = tripsCategory.id;
    }
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // If this is a recurring expense, create a RecurringTemplate and link the instance
  if (body.recurring && body.recurringInterval) {
    const template = await prisma.recurringTemplate.create({
      data: {
        userId,
        categoryId,
        amount: body.amount,
        description: body.description,
        recurringInterval: body.recurringInterval,
        startDate: body.date ? new Date(body.date) : new Date(),
      },
    });

    const expense = await prisma.expense.create({
      data: {
        amount: body.amount,
        description: body.description,
        date: body.date ? new Date(body.date) : new Date(),
        categoryId,
        recurring: false,
        recurringInterval: body.recurringInterval,
        recurringTemplateId: template.id,
        tripId: body.tripId || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  }

  const expense = await prisma.expense.create({
    data: {
      amount: body.amount,
      description: body.description,
      date: body.date ? new Date(body.date) : new Date(),
      categoryId,
      recurring: false,
      recurringInterval: null,
      tripId: body.tripId || null,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
