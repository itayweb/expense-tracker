-- Delete unlinked expense instances that correspond to a RecurringTemplate.
-- These are pre-migration generated copies that will be properly re-created
-- (with recurringTemplateId set) on the next generateRecurringExpenses run.
-- Matching directly against RecurringTemplate means this works even before
-- any linked instances exist (e.g. on a fresh build before the first page load).

DELETE FROM "Expense"
WHERE "recurringTemplateId" IS NULL
  AND "recurringInterval" IS NULL
  AND "recurring" = false
  AND EXISTS (
    SELECT 1
    FROM "RecurringTemplate" rt
    WHERE rt."categoryId" = "Expense"."categoryId"
      AND LOWER(rt."description") = LOWER("Expense"."description")
      AND rt."amount" = "Expense"."amount"
  );
