"use client";

import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatCurrency, getProgressTextColor } from "@/lib/utils";

interface BudgetOverviewProps {
  monthlyIncome: number;
  totalSpent: number;
  totalAllocated: number;
}

export default function BudgetOverview({
  monthlyIncome,
  totalSpent,
  totalAllocated,
}: BudgetOverviewProps) {
  const spentPercentage = monthlyIncome > 0 ? (totalSpent / monthlyIncome) * 100 : 0;

  return (
    <Card className="mb-6 bg-gradient-to-br from-[#1A1A2E] to-[#242442]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <p className="text-sm text-slate-400">Monthly Income</p>
          <p className="text-3xl font-bold text-slate-100">
            {formatCurrency(monthlyIncome)}
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-sm text-slate-400">Spent</p>
            <p className={`text-xl font-bold ${getProgressTextColor(spentPercentage)}`}>
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Allocated</p>
            <p className="text-xl font-bold text-slate-300">
              {formatCurrency(totalAllocated)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Remaining</p>
            <p className={`text-xl font-bold ${
              monthlyIncome - totalSpent >= 0 ? "text-emerald-400" : "text-red-400"
            }`}>
              {formatCurrency(monthlyIncome - totalSpent)}
            </p>
          </div>
        </div>
      </div>
      <ProgressBar current={totalSpent} max={monthlyIncome} height="h-3" />
    </Card>
  );
}
