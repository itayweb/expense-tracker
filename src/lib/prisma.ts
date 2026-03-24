import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function buildPrismaClient() {
  // Ensure pgbouncer compatibility - disable prepared statements
  let url = process.env.DATABASE_URL || "";
  if (url && !url.includes("statement_cache_size")) {
    url += url.includes("?") ? "&statement_cache_size=0" : "?statement_cache_size=0";
  }
  return new PrismaClient({ datasourceUrl: url });
}

export const prisma = globalForPrisma.prisma || buildPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
