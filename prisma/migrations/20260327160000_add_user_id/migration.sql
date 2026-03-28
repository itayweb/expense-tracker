-- Add userId to Budget / Trip, backfill legacy rows, and update unique index

ALTER TABLE "Budget" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'legacy_user';

DROP INDEX IF EXISTS "Budget_month_year_key";
CREATE UNIQUE INDEX "Budget_userId_month_year_key" ON "Budget"("userId", "month", "year");

ALTER TABLE "Trip" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'legacy_user';

