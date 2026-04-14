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
  // scope: "single" (default) | "future"
  const scope: "single" | "future" = body.scope ?? "single";

  const existing = await prisma.expense.findFirst({
    where: { id: parseInt(id), category: { userId } },
    select: { id: true, recurringTemplateId: true, date: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // "This and all future" — update the template and delete future instances
  if (scope === "future" && existing.recurringTemplateId) {
    const templateId = existing.recurringTemplateId;

    // Verify template belongs to this user
    const template = await prisma.recurringTemplate.findFirst({
      where: { id: templateId, userId },
    });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Update the template
    if (
      body.amount !== undefined ||
      body.description !== undefined ||
      body.recurringInterval !== undefined
    ) {
      await prisma.recurringTemplate.update({
        where: { id: templateId },
        data: {
          ...(body.amount !== undefined && { amount: body.amount }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.recurringInterval !== undefined && { recurringInterval: body.recurringInterval }),
        },
      });
    }

    // Delete all instances from this expense's date onward (they'll regenerate)
    await prisma.expense.deleteMany({
      where: {
        recurringTemplateId: templateId,
        date: { gte: existing.date },
        category: { userId },
      },
    });

    return NextResponse.json({ success: true, regenerated: true });
  }

  // "Just this one" — update only this expense
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  // scope: "single" (default) | "future"
  const scope = request.nextUrl.searchParams.get("scope") ?? "single";

  const existing = await prisma.expense.findFirst({
    where: { id: parseInt(id), category: { userId } },
    select: { id: true, recurringTemplateId: true, date: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (scope === "future" && existing.recurringTemplateId) {
    const templateId = existing.recurringTemplateId;

    // Verify template belongs to this user
    const template = await prisma.recurringTemplate.findFirst({
      where: { id: templateId, userId },
    });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Delete all instances from this date onward
    await prisma.expense.deleteMany({
      where: {
        recurringTemplateId: templateId,
        date: { gte: existing.date },
        category: { userId },
      },
    });

    // Delete the template itself (stops future generation)
    await prisma.recurringTemplate.delete({ where: { id: templateId } });

    return NextResponse.json({ success: true });
  }

  await prisma.expense.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
