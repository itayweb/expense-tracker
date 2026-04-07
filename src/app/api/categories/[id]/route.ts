import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.category.findFirst({
    where: { id: parseInt(id), userId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const category = await prisma.category.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      type: body.type,
    },
  });

  // Update budgetAmount in the specific budget if budgetId is provided
  if (body.budgetId !== undefined && body.budgetAmount !== undefined) {
    await prisma.budgetCategory.updateMany({
      where: { budgetId: body.budgetId, categoryId: parseInt(id) },
      data: { budgetAmount: body.budgetAmount },
    });
  }

  return NextResponse.json(category);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.category.findFirst({
    where: { id: parseInt(id), userId, isSystem: false },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
