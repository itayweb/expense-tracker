"use client";

import { formatCurrency } from "@/lib/utils";
import { ExpenseItem } from "@/lib/types";

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onRefresh: () => void;
}

export default function ExpenseList({ expenses, onRefresh }: ExpenseListProps) {
  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  if (expenses.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-2">No expenses yet</p>;
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between text-sm py-1.5"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-gray-900 truncate">{expense.description}</p>
              {expense.recurring && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                  {expense.recurringInterval === "weekly" ? "weekly" : "monthly"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {new Date(expense.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <span className="font-medium text-gray-700">
              {formatCurrency(expense.amount)}
            </span>
            <button
              onClick={() => handleDelete(expense.id)}
              className="text-gray-300 hover:text-red-500 text-lg leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
