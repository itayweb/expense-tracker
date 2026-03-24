import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const category = await prisma.category.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      type: body.type,
      budgetAmount: body.budgetAmount,
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.category.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ success: true });
}
