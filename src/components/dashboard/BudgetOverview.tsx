"use client";

import { formatCurrency } from "@/lib/utils";

interface BudgetOverviewProps {
  monthlyIncome: number;
  totalSpent: number;
  totalAllocated: number;
}

// Simple sparkline path — decorative wave representing spending trend
function Sparkline() {
  return (
    <svg viewBox="0 0 200 40" className="w-full h-10 opacity-40" preserveAspectRatio="none">
      <polyline
        points="0,32 25,28 50,30 75,20 100,22 125,16 150,18 175,12 200,8"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="200" cy="8" r="3" fill="white" />
    </svg>
  );
}

export default function BudgetOverview({
  monthlyIncome,
  totalSpent,
  totalAllocated,
}: BudgetOverviewProps) {
  const spentPercentage = monthlyIncome > 0 ? Math.round((totalSpent / monthlyIncome) * 100) : 0;
  const remaining = monthlyIncome - totalSpent;
  const isSaving = remaining >= 0;

  return (
    <div className="rounded-2xl overflow-hidden mb-4">
      {/* Green hero card */}
      <div className="bg-[#22C55E] px-5 pt-5 pb-4">
        <p className="text-xs text-green-100 uppercase tracking-widest font-medium mb-1">
          This Month&apos;s Spend
        </p>
        <p className="text-4xl font-bold text-white mb-1">
          {formatCurrency(totalSpent)}
        </p>
        <p className="text-sm text-green-100 mb-4">
          {isSaving ? "✓" : "↑"} {spentPercentage}% of monthly income used
        </p>
        <Sparkline />
      </div>

      {/* Stats strip below hero */}
      <div className="bg-white border border-gray-100 grid grid-cols-3 divide-x divide-gray-100 rounded-b-2xl">
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">Income</p>
          <p className="text-sm font-bold text-gray-800">{formatCurrency(monthlyIncome)}</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">Allocated</p>
          <p className="text-sm font-bold text-gray-800">{formatCurrency(totalAllocated)}</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
          <p className={`text-sm font-bold ${isSaving ? "text-[#22C55E]" : "text-red-500"}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
    </div>
  );
}
