-- Remove unlinked expense instances that are now duplicated by a linked recurring instance.
-- An unlinked instance matches if it has the same categoryId + description + amount
-- within the same calendar month, and a linked instance (recurringTemplateId IS NOT NULL)
-- already exists for that slot.
-- We only target rows where recurringInterval IS NULL (pre-migration generated copies)
-- to avoid accidentally deleting manually entered expenses.

DELETE FROM "Expense"
WHERE "recurringTemplateId" IS NULL
  AND "recurringInterval" IS NULL
  AND "recurring" = false
  AND EXISTS (
    SELECT 1
    FROM "Expense" e2
    WHERE e2."recurringTemplateId" IS NOT NULL
      AND e2."categoryId" = "Expense"."categoryId"
      AND LOWER(e2."description") = LOWER("Expense"."description")
      AND e2."amount" = "Expense"."amount"
      AND DATE_TRUNC('month', e2."date") = DATE_TRUNC('month', "Expense"."date")
  );
