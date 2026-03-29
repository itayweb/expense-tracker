import { auth } from "@clerk/nextjs/server";

export async function getAuthedUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}
