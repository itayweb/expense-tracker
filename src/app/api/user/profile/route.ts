import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserId } from "@/lib/auth/server";
import { normalizeUsername, validateUsernameFormat } from "@/lib/usernameAuth";

/** Current user's profile (for header / client). */
export async function GET() {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ username: null }, { status: 401 });
  }
  const profile = await prisma.userProfile.findUnique({
    where: { authUserId: userId },
    select: { username: true, displayName: true },
  });
  return NextResponse.json({
    username: profile?.username ?? null,
    displayName: profile?.displayName ?? null,
  });
}

/** Create profile after sign-up (links auth user to chosen username). */
export async function POST(request: NextRequest) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const raw = typeof body.username === "string" ? body.username : "";
  const username = normalizeUsername(raw);
  const formatErr = validateUsernameFormat(username);
  if (formatErr) {
    return NextResponse.json({ error: formatErr }, { status: 400 });
  }

  const existingForUser = await prisma.userProfile.findUnique({
    where: { authUserId: userId },
  });
  if (existingForUser) {
    return NextResponse.json({
      username: existingForUser.username,
      displayName: existingForUser.displayName,
    });
  }

  const taken = await prisma.userProfile.findUnique({
    where: { username },
  });
  if (taken) {
    return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
  }

  const profile = await prisma.userProfile.create({
    data: {
      authUserId: userId,
      username,
      displayName: username,
    },
  });
  return NextResponse.json(
    { username: profile.username, displayName: profile.displayName },
    { status: 201 }
  );
}
