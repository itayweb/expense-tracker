import type { NextRequest } from "next/server";
import { neonAuthMiddleware } from "@neondatabase/auth/next/server";

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/auth/sign-in" || pathname === "/auth/sign-up" || pathname === "/auth/callback") return;
  if (pathname.startsWith("/api/")) return;  // API routes handle their own auth (return 401)
  if (request.headers.get("Next-Action")) return;
  if (!process.env.NEON_AUTH_BASE_URL) return;
  return neonAuthMiddleware({ loginUrl: "/auth/sign-in" })(request);
}

export const config = { matcher: ["/((?!_next|favicon).*)"] };
