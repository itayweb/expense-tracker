import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");

  const trips = await prisma.trip.findMany({
    where: status ? { userId, status } : { userId },
    include: {
      expenses: {
        include: { trip: { select: { id: true, name: true } } },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const tripsWithTotals = trips.map((trip) => ({
    ...trip,
    totalSpent: trip.expenses.reduce((sum, exp) => sum + exp.amount, 0),
  }));

  return NextResponse.json(tripsWithTotals);
}

export async function POST(request: NextRequest) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const trip = await prisma.trip.create({
    data: {
      userId,
      name: body.name,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  });

  return NextResponse.json(trip, { status: 201 });
}
