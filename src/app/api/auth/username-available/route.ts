import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { normalizeUsername, validateUsernameFormat } from "@/lib/usernameAuth";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("username") || "";
  const username = normalizeUsername(raw);
  const formatErr = validateUsernameFormat(username);
  if (formatErr) {
    return NextResponse.json({ available: false, reason: formatErr }, { status: 400 });
  }
  const existing = await prisma.userProfile.findUnique({
    where: { username },
    select: { id: true },
  });
  return NextResponse.json({ available: !existing });
}
