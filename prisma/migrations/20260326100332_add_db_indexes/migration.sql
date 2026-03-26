-- CreateIndex
CREATE INDEX "Category_budgetId_idx" ON "Category"("budgetId");

-- CreateIndex
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- CreateIndex
CREATE INDEX "Expense_tripId_idx" ON "Expense"("tripId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");
