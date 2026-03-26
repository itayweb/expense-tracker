import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const expense = await prisma.expense.update({
    where: { id: parseInt(id) },
    data: {
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
    },
  });

  return NextResponse.json(expense);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.expense.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ success: true });
}
