"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import DonutChart from "@/components/ui/DonutChart";
import { CategoryWithExpenses } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
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

  return (
    <>
      <Card className="flex flex-col hover:border-white/[0.15] transition-all">
        <div
          className="cursor-pointer flex items-center gap-4"
          onClick={() => setShowExpensesModal(true)}
        >
          <DonutChart
            current={displaySpent}
            max={displayBudget}
            size={64}
            strokeWidth={6}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-100 truncate">{category.name}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  category.type === "weekly"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-purple-500/15 text-purple-400"
                }`}
              >
                {category.type}
              </span>
              {isWeekly && (
                <span className="text-xs text-slate-500">
                  Wk {category.weeklyInfo!.currentWeekNumber}
                </span>
              )}
            </div>

            <div className="text-sm text-slate-400">
              {formatCurrency(displaySpent)} / {formatCurrency(displayBudget)}
              {isWeekly ? "/week" : "/month"}
            </div>

            {isWeekly && category.weeklyInfo!.carryOverDebt > 0 && (
              <p className="text-xs text-red-400 mt-0.5">
                {formatCurrency(category.weeklyInfo!.carryOverDebt)} carried from prior weeks
              </p>
            )}
          </div>
        </div>
      </Card>

      <CategoryExpensesModal
        isOpen={showExpensesModal}
        onClose={() => setShowExpensesModal(false)}
        category={category}
        onRefresh={onRefresh}
      />
    </>
  );
}
