"use client";

import { useState, useMemo } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ExpenseList from "./ExpenseList";
import AddExpenseModal from "./AddExpenseModal";
import { CategoryWithExpenses } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { getWeekBoundaries, getCurrentWeekNumber } from "@/lib/weekUtils";

interface CategoryExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryWithExpenses;
  onRefresh: () => void;
}

export default function CategoryExpensesModal({
  isOpen,
  onClose,
  category,
  onRefresh,
}: CategoryExpensesModalProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { filteredExpenses, periodLabel } = useMemo(() => {
    if (category.type === "weekly") {
      const weekNum = getCurrentWeekNumber(month, year);
      const weeks = getWeekBoundaries(month, year);
      const currentWeek = weeks.find((w) => w.weekNumber === weekNum);

      if (currentWeek) {
        const startDay = new Date(currentWeek.start.getFullYear(), currentWeek.start.getMonth(), currentWeek.start.getDate());
        const endDay = new Date(currentWeek.end.getFullYear(), currentWeek.end.getMonth(), currentWeek.end.getDate());

        const filtered = category.expenses.filter((exp) => {
          const d = new Date(exp.date);
          const expDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          return expDay >= startDay && expDay <= endDay;
        });

        const monthName = now.toLocaleString("default", { month: "long" });
        return {
          filteredExpenses: filtered,
          periodLabel: `Week ${weekNum} of ${monthName} ${year}`,
        };
      }
    }

    // Monthly: filter to current month
    const filtered = category.expenses.filter((exp) => {
      const d = new Date(exp.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    const monthName = now.toLocaleString("default", { month: "long" });
    return {
      filteredExpenses: filtered,
      periodLabel: `${monthName} ${year}`,
    };
  }, [category, month, year]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const isWeekly = category.type === "weekly";
  const displayBudget = isWeekly && category.weeklyInfo
    ? category.weeklyInfo.effectiveBudget
    : category.budgetAmount;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={category.name} size="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{periodLabel}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                category.type === "weekly"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {category.type}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">Spent</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(totalSpent)} / {formatCurrency(displayBudget)}
            </span>
          </div>

          <ExpenseList expenses={filteredExpenses} onRefresh={onRefresh} />

          <Button
            size="sm"
            className="w-full"
            onClick={() => setShowAddModal(true)}
          >
            + Add Expense
          </Button>
        </div>
      </Modal>

      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categoryId={category.id}
        categoryName={category.name}
        onSaved={() => {
          setShowAddModal(false);
          onRefresh();
        }}
      />
    </>
  );
}
