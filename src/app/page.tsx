"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BudgetOverview from "@/components/dashboard/BudgetOverview";
import CategoryGrid from "@/components/dashboard/CategoryGrid";
import { BudgetWithCategories } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [budget, setBudget] = useState<BudgetWithCategories | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/budget");
      if (!res.ok) {
        console.error("Budget API error:", res.status);
        return;
      }
      const data = await res.json();
      if (!data || data.error) {
        router.push("/wizard");
        return;
      }
      setBudget(data);
    } catch (error) {
      console.error("Failed to fetch budget:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!budget) return null;

  const weeksInMonth = budget.weeksInMonth || 4;
  const totalSpent = budget.categories.reduce(
    (sum, cat) => {
      if (cat.type === "weekly" && cat.weeklyInfo) {
        return sum + cat.weeklyInfo.totalMonthSpent;
      }
      return sum + cat.totalSpent;
    },
    0
  );
  const totalAllocated = budget.categories.reduce(
    (sum, cat) => {
      if (cat.type === "weekly") {
        return sum + cat.budgetAmount * weeksInMonth;
      }
      return sum + cat.budgetAmount;
    },
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentTab="dashboard"
        budgetMonth={budget.month}
        budgetYear={budget.year}
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <BudgetOverview
          monthlyIncome={budget.monthlyIncome}
          totalSpent={totalSpent}
          totalAllocated={totalAllocated}
        />
        <CategoryGrid
          categories={budget.categories}
          onRefresh={fetchBudget}
        />
      </main>
    </div>
  );
}
