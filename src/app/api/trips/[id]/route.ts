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

  const existing = await prisma.trip.findFirst({
    where: { id: parseInt(id), userId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const trip = await prisma.trip.update({
    where: { id: parseInt(id) },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.startDate !== undefined && {
        startDate: body.startDate ? new Date(body.startDate) : null,
      }),
      ...(body.endDate !== undefined && {
        endDate: body.endDate ? new Date(body.endDate) : null,
      }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  return NextResponse.json(trip);
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

  const existing = await prisma.trip.findFirst({
    where: { id: parseInt(id), userId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trip.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ success: true });
}
