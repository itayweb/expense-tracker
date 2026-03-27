import { authApiHandler } from "@neondatabase/auth/next/server";

const handler = () => authApiHandler();

export const GET = (...args: Parameters<ReturnType<typeof authApiHandler>["GET"]>) =>
  handler().GET(...args);
export const POST = (...args: Parameters<ReturnType<typeof authApiHandler>["POST"]>) =>
  handler().POST(...args);
export const PUT = (...args: Parameters<ReturnType<typeof authApiHandler>["PUT"]>) =>
  handler().PUT(...args);
export const DELETE = (...args: Parameters<ReturnType<typeof authApiHandler>["DELETE"]>) =>
  handler().DELETE(...args);
export const PATCH = (...args: Parameters<ReturnType<typeof authApiHandler>["PATCH"]>) =>
  handler().PATCH(...args);

