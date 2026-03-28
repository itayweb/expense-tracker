import { createAuthServer } from "@neondatabase/auth/next/server";
import { neonAuth } from "@neondatabase/auth/next/server";

let _auth: ReturnType<typeof createAuthServer> | null = null;

export function authServer() {
  if (_auth) return _auth;
  if (!process.env.NEON_AUTH_BASE_URL) {
    throw new Error(
      "Missing environment variable: NEON_AUTH_BASE_URL. \n You must provide the auth url of your Neon Auth instance in environment variables"
    );
  }
  if (!process.env.NEON_AUTH_COOKIE_SECRET) {
    throw new Error(
      "Missing environment variable: NEON_AUTH_COOKIE_SECRET."
    );
  }
  // Allow additional origins (e.g. Vercel preview/production URLs).
  // Set BETTER_AUTH_TRUSTED_ORIGINS as a comma-separated list in your env.
  const extraOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

  _auth = createAuthServer(extraOrigins.length ? { trustedOrigins: extraOrigins } : undefined);
  return _auth;
}

export async function getAuthedUserId(): Promise<string | null> {
  if (!process.env.NEON_AUTH_BASE_URL || !process.env.NEON_AUTH_COOKIE_SECRET) {
    return null;
  }
  try {
    const { user } = await neonAuth();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

