import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.trip.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ success: true });
}
