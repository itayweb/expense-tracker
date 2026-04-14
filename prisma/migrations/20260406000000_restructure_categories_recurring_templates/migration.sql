-- Migration: restructure-categories-recurring-templates
--
-- 1. Add userId to Category, backfill from Budget
-- 2. Consolidate duplicate categories (same user + name → one canonical row)
-- 3. Create BudgetCategory join table, populate from old Category rows
-- 4. Create RecurringTemplate table, populate from recurring=true expenses
-- 5. Add recurringTemplateId to Expense; delete old recurring=true template rows
-- 6. Drop budgetId + budgetAmount from Category

-- ============================================================
-- PHASE 1: Add userId to Category and backfill from Budget
-- ============================================================

ALTER TABLE "Category" ADD COLUMN "userId" TEXT;

UPDATE "Category" c
SET "userId" = b."userId"
FROM "Budget" b
WHERE c."budgetId" = b."id";

-- Any orphaned categories (no budget) default to legacy_user
UPDATE "Category" SET "userId" = 'legacy_user' WHERE "userId" IS NULL;

ALTER TABLE "Category" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "userId" SET DEFAULT 'legacy_user';

-- ============================================================
-- PHASE 2: Build a canonical category mapping
-- (same userId + lowercase name → keep the oldest id)
-- ============================================================

CREATE TEMP TABLE category_canonical AS
SELECT
  c."id" AS old_id,
  (
    SELECT MIN(c2."id")
    FROM "Category" c2
    WHERE c2."userId" = c."userId"
      AND LOWER(c2."name") = LOWER(c."name")
  ) AS canonical_id
FROM "Category" c;

-- Re-point all expenses to the canonical category
UPDATE "Expense" e
SET "categoryId" = cm.canonical_id
FROM category_canonical cm
WHERE e."categoryId" = cm.old_id
  AND cm.old_id <> cm.canonical_id;

-- ============================================================
-- PHASE 3: Create BudgetCategory and populate
-- ============================================================

CREATE TABLE "BudgetCategory" (
  "id"           SERIAL PRIMARY KEY,
  "budgetId"     INTEGER NOT NULL,
  "categoryId"   INTEGER NOT NULL,
  "budgetAmount" DOUBLE PRECISION NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BudgetCategory_budgetId_fkey"
    FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BudgetCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BudgetCategory_budgetId_categoryId_key"
    UNIQUE ("budgetId", "categoryId")
);

CREATE INDEX "BudgetCategory_budgetId_idx"   ON "BudgetCategory"("budgetId");
CREATE INDEX "BudgetCategory_categoryId_idx" ON "BudgetCategory"("categoryId");

-- Populate: for each old category row, insert one BudgetCategory pointing to the canonical id.
-- Use DISTINCT ON to avoid duplicate (budgetId, canonicalId) pairs (in case two same-named
-- categories existed in the same budget — pick the one with highest budgetAmount).
INSERT INTO "BudgetCategory" ("budgetId", "categoryId", "budgetAmount")
SELECT DISTINCT ON (c."budgetId", cm.canonical_id)
  c."budgetId",
  cm.canonical_id,
  c."budgetAmount"
FROM "Category" c
JOIN category_canonical cm ON cm.old_id = c."id"
ORDER BY c."budgetId", cm.canonical_id, c."budgetAmount" DESC;

-- Delete non-canonical category rows (expenses already re-pointed above)
DELETE FROM "Category"
WHERE "id" NOT IN (SELECT DISTINCT canonical_id FROM category_canonical);

-- ============================================================
-- PHASE 4: Drop old Category columns (budgetId, budgetAmount)
-- and add index on userId
-- ============================================================

DROP INDEX IF EXISTS "Category_budgetId_idx";
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_budgetId_fkey";
ALTER TABLE "Category" DROP COLUMN "budgetId";
ALTER TABLE "Category" DROP COLUMN "budgetAmount";

CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- ============================================================
-- PHASE 5: Create RecurringTemplate table
-- ============================================================

CREATE TABLE "RecurringTemplate" (
  "id"                SERIAL PRIMARY KEY,
  "userId"            TEXT NOT NULL DEFAULT 'legacy_user',
  "categoryId"        INTEGER NOT NULL,
  "amount"            DOUBLE PRECISION NOT NULL,
  "description"       TEXT NOT NULL,
  "recurringInterval" TEXT NOT NULL,
  "startDate"         TIMESTAMP(3) NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecurringTemplate_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "RecurringTemplate_userId_idx"    ON "RecurringTemplate"("userId");
CREATE INDEX "RecurringTemplate_categoryId_idx" ON "RecurringTemplate"("categoryId");

-- Populate from recurring=true expenses.
-- Deduplicate by (canonical categoryId, description, amount, recurringInterval),
-- keeping the earliest date as startDate.
INSERT INTO "RecurringTemplate" ("userId", "categoryId", "amount", "description", "recurringInterval", "startDate", "updatedAt")
SELECT DISTINCT ON (e."categoryId", LOWER(e."description"), e."amount", COALESCE(e."recurringInterval", 'monthly'))
  c."userId",
  e."categoryId",
  e."amount",
  e."description",
  COALESCE(e."recurringInterval", 'monthly'),
  MIN(e."date") OVER (
    PARTITION BY e."categoryId", LOWER(e."description"), e."amount", COALESCE(e."recurringInterval", 'monthly')
  ),
  NOW()
FROM "Expense" e
JOIN "Category" c ON c."id" = e."categoryId"
WHERE e."recurring" = true
ORDER BY e."categoryId", LOWER(e."description"), e."amount", COALESCE(e."recurringInterval", 'monthly');

-- ============================================================
-- PHASE 6: Add recurringTemplateId to Expense
-- ============================================================

ALTER TABLE "Expense" ADD COLUMN "recurringTemplateId" INTEGER;

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_recurringTemplateId_fkey"
  FOREIGN KEY ("recurringTemplateId") REFERENCES "RecurringTemplate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Expense_recurringTemplateId_idx" ON "Expense"("recurringTemplateId");

-- ============================================================
-- PHASE 7: Delete old recurring=true template expense rows
-- (they are now represented by RecurringTemplate rows)
-- ============================================================

DELETE FROM "Expense" WHERE "recurring" = true;

-- ============================================================
-- PHASE 8: Clean up
-- ============================================================

DROP TABLE category_canonical;
