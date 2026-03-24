"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import { CategoryWithExpenses } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import ExpenseList from "./ExpenseList";
import AddExpenseModal from "./AddExpenseModal";

interface CategoryCardProps {
  category: CategoryWithExpenses;
  onRefresh: () => void;
}

export default function CategoryCard({ category, onRefresh }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const isWeekly = category.type === "weekly" && category.weeklyInfo;
  const displaySpent = isWeekly
    ? category.weeklyInfo!.currentWeekSpent
    : category.totalSpent;
  const displayBudget = isWeekly
    ? category.weeklyInfo!.effectiveBudget
    : category.budgetAmount;

  return (
    <>
      <Card className="flex flex-col">
        <div
          className="cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  category.type === "weekly"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {category.type}
              </span>
              {isWeekly && (
                <span className="text-xs text-gray-400">
                  Week {category.weeklyInfo!.currentWeekNumber}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-400">
              {expanded ? "▲" : "▼"}
            </span>
          </div>

          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>
              {formatCurrency(displaySpent)} / {formatCurrency(displayBudget)}
              {isWeekly ? "/week" : "/month"}
            </span>
            {isWeekly && (
              <span className="text-xs text-gray-400">
                {formatCurrency(category.budgetAmount)}/week budget
              </span>
            )}
          </div>

          {isWeekly && category.weeklyInfo!.carryOverDebt > 0 && (
            <p className="text-xs text-red-500 mb-1">
              {formatCurrency(category.weeklyInfo!.carryOverDebt)} carried from prior weeks
            </p>
          )}

          <ProgressBar
            current={displaySpent}
            max={displayBudget}
            showLabel={false}
            height="h-2.5"
          />
        </div>

        <div className="mt-3">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddModal(true);
            }}
            className="w-full"
          >
            + Add Expense
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <ExpenseList
              expenses={category.expenses}
              onRefresh={onRefresh}
            />
          </div>
        )}
      </Card>

      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categoryId={category.id}
        categoryName={category.name}
        onSaved={onRefresh}
      />
    </>
  );
}
