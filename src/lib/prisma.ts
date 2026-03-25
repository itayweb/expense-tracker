import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function buildPrismaClient() {
  let url = process.env.DATABASE_URL || "";
  // pgbouncer=true disables prepared statements, required for Supabase/PgBouncer
  // connection poolers which don't support prepared statements across connections
  if (url && !url.includes("pgbouncer=true")) {
    url += url.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true";
  }
  return new PrismaClient({ datasourceUrl: url });
}

// Always store on globalThis so the singleton survives module re-evaluation
// in both dev (HMR) and production (Next.js warm re-use of the same process)
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = buildPrismaClient();
}

export const prisma = globalForPrisma.prisma;
