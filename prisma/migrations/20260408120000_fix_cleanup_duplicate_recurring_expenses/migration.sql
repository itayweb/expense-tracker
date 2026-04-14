-- Delete unlinked expense instances for the current month that are covered
-- by a RecurringTemplate. Previous months are preserved as historical records.
-- The new system will re-generate this month's instances with recurringTemplateId set.

DELETE FROM "Expense"
WHERE "recurringTemplateId" IS NULL
  AND date_trunc('month', "date") = date_trunc('month', NOW())
  AND EXISTS (
    SELECT 1
    FROM "RecurringTemplate" rt
    WHERE rt."categoryId" = "Expense"."categoryId"
      AND LOWER(rt."description") = LOWER("Expense"."description")
      AND rt."amount" = "Expense"."amount"
  );
