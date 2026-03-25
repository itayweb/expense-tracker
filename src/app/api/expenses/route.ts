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

  const expense = await prisma.expense.create({
    data: {
      amount: body.amount,
      description: body.description,
      date: body.date ? new Date(body.date) : new Date(),
      categoryId: body.categoryId,
      recurring: body.recurring || false,
      recurringInterval: body.recurring ? body.recurringInterval || null : null,
      tripId: body.tripId || null,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
