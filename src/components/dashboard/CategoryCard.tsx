"use client";

import { useState } from "react";
import { CategoryWithExpenses } from "@/lib/types";
import { formatCurrency, getCategoryColor } from "@/lib/utils";
import CategoryExpensesModal from "./CategoryExpensesModal";

interface CategoryCardProps {
  category: CategoryWithExpenses;
  onRefresh: () => void;
}

export default function CategoryCard({ category, onRefresh }: CategoryCardProps) {
  const [showExpensesModal, setShowExpensesModal] = useState(false);

  const isWeekly = category.type === "weekly" && category.weeklyInfo;
  const displaySpent = isWeekly
    ? category.weeklyInfo!.currentWeekSpent
    : category.totalSpent;
  const displayBudget = isWeekly
    ? category.weeklyInfo!.effectiveBudget
    : category.budgetAmount;

  const percentage = displayBudget > 0 ? Math.min((displaySpent / displayBudget) * 100, 100) : 0;
  const iconColor = getCategoryColor(category.name);
  const initial = category.name.charAt(0).toUpperCase();
  const icon = category.emoji ?? initial;

  return (
    <>
      <div
        className="flex items-center gap-3 py-3 px-1 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors group"
        onClick={() => setShowExpensesModal(true)}
      >
        {/* Colored icon circle */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
          style={{ backgroundColor: iconColor }}
        >
          {icon}
        </div>

        {/* Name + budget info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{category.name}</p>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                  category.type === "weekly"
                    ? "bg-blue-50 text-blue-500"
                    : "bg-purple-50 text-purple-500"
                }`}
              >
                {isWeekly ? `Wk ${category.weeklyInfo!.currentWeekNumber}` : "monthly"}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-800 ml-2">
              {formatCurrency(displaySpent)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: percentage >= 85 ? "#EF4444" : percentage >= 60 ? "#F59E0B" : iconColor,
                }}
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              of {formatCurrency(displayBudget)}
            </span>
          </div>
          {isWeekly && category.weeklyInfo!.carryOverDebt > 0 && (
            <p className="text-xs text-red-400 mt-0.5">
              +{formatCurrency(category.weeklyInfo!.carryOverDebt)} carried over
            </p>
          )}
        </div>

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <CategoryExpensesModal
        isOpen={showExpensesModal}
        onClose={() => setShowExpensesModal(false)}
        category={category}
        onRefresh={onRefresh}
      />
    </>
  );
}
