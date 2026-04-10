"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BudgetOverview from "@/components/dashboard/BudgetOverview";
import CategoryGrid from "@/components/dashboard/CategoryGrid";
import TripSection from "@/components/dashboard/TripSection";
import AddExpenseModal from "@/components/dashboard/AddExpenseModal";
import { BudgetWithCategories } from "@/lib/types";
import { getCachedBudget, isBudgetCacheFresh, setCachedBudget } from "@/lib/budgetCache";

export default function DashboardPage() {
  const router = useRouter();
  const [budget, setBudget] = useState<BudgetWithCategories | null>(() => getCachedBudget());
  const [loading, setLoading] = useState(!getCachedBudget());
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/budget");
      if (res.status === 401) {
        router.push("/auth/sign-in");
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (!data || data.error) {
        router.push("/wizard");
        return;
      }
      setCachedBudget(data);
      setBudget(data);
    } catch (error) {
      console.error("Failed to fetch budget:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Skip network call if cache is fresh (e.g. navigating back within 30s)
    if (isBudgetCacheFresh()) return;
    fetchBudget();
  }, [fetchBudget]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F7FA]">
        <div className="animate-spin h-8 w-8 border-4 border-[#22C55E] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!budget) return null;

  const weeksInMonth = budget.weeksInMonth || 4;
  const regularCategories = budget.categories.filter((cat) => !cat.isSystem);

  const totalSpent = regularCategories.reduce(
    (sum, cat) => {
      if (cat.type === "weekly" && cat.weeklyInfo) {
        return sum + cat.weeklyInfo.totalMonthSpent;
      }
      return sum + cat.totalSpent;
    },
    0
  );
  const totalAllocated = regularCategories.reduce(
    (sum, cat) => {
      if (cat.type === "weekly") {
        return sum + cat.budgetAmount * weeksInMonth;
      }
      return sum + cat.budgetAmount;
    },
    0
  );

  return (
    <div className="bg-[#F5F7FA]">
      <Header
        currentTab="dashboard"
        budgetMonth={budget.month}
        budgetYear={budget.year}
      />

      <main className="max-w-2xl mx-auto px-4 py-4 pb-24">
        <BudgetOverview
          monthlyIncome={budget.monthlyIncome}
          totalSpent={totalSpent}
          totalAllocated={totalAllocated}
        />

        {/* Categories section */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Budget Categories</h2>
        </div>
        <CategoryGrid
          categories={regularCategories}
          onRefresh={fetchBudget}
        />

        <TripSection onRefresh={fetchBudget} />

        <AddExpenseModal
          isOpen={showAddExpenseModal}
          onClose={() => setShowAddExpenseModal(false)}
          categories={regularCategories}
          onSaved={fetchBudget}
        />
      </main>

      {/* Floating + button (Trakki style) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          data-testid="add-expense-fab"
          onClick={() => setShowAddExpenseModal(true)}
          className="w-14 h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-xl shadow-gray-400/30 flex items-center justify-center text-2xl font-light transition-all active:scale-95"
          title="Add Expense"
        >
          +
        </button>
      </div>
    </div>
  );
}
