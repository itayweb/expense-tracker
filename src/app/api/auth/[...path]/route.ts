import { NextRequest } from "next/server";
import { authApiHandler } from "@neondatabase/auth/next/server";

const inner = authApiHandler();

/**
 * Normalize the Origin header to the production URL before forwarding to
 * the Neon Auth server. This lets a single trusted origin cover all
 * Vercel preview deployments (which have unique, unpredictable URLs).
 *
 * Set NEXT_PUBLIC_APP_URL=https://your-app.vercel.app in Vercel env vars.
 */
function withNormalizedOrigin(req: NextRequest): NextRequest {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return req;

  const origin = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
  const headers = new Headers(req.headers);
  headers.set("origin", origin);
  return new NextRequest(req.url, {
    method: req.method,
    headers,
    body: req.body,
  });
}

type HandlerArgs = Parameters<ReturnType<typeof authApiHandler>["GET"]>;

const handle = (req: NextRequest, ctx: HandlerArgs[1]) =>
  inner.GET(withNormalizedOrigin(req), ctx);

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
