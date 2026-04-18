"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import MonthNavigator from "@/components/history/MonthNavigator";
import WeekNavigator from "@/components/history/WeekNavigator";
import { formatCurrency, getCategoryColor } from "@/lib/utils";
import { ExpenseItem } from "@/lib/types";
import ExpenseList from "@/components/dashboard/ExpenseList";
import {
  getHistoryCacheKey,
  getCachedHistory,
  isHistoryCacheFresh,
  setCachedHistory,
} from "@/lib/historyCache";

interface HistoryCategory {
  id: number;
  name: string;
  emoji?: string | null;
  type: string;
  budgetAmount: number;
  isSystem?: boolean;
  expenses: ExpenseItem[];
  totalSpent: number;
}

interface WeekBoundary {
  weekNumber: number;
  start: string;
  end: string;
}

interface HistoryData {
  budget: { id: number; monthlyIncome: number; month: number; year: number } | null;
  categories: HistoryCategory[];
  weeks: WeekBoundary[];
}

function SpendingBarChart({
  categories,
  activeCategoryId,
  onCategoryClick,
}: {
  categories: HistoryCategory[];
  activeCategoryId: number | null;
  onCategoryClick: (id: number | null) => void;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setAnimated(true); }, []);

  const visible = categories
    .filter((c) => !c.isSystem && c.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 8);

  if (visible.length === 0) return null;
  const max = Math.max(...visible.map((c) => Math.max(c.totalSpent, c.budgetAmount)));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
      <div className="flex items-center gap-4 mb-3">
        <p className="text-sm font-semibold text-gray-700">Spending by Category</p>
        <div className="flex items-center gap-3 ml-auto">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-4 h-1.5 rounded-full bg-[#22C55E] opacity-40 inline-block" /> Budget
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-4 h-2 rounded-full bg-amber-400 inline-block" /> Spent
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {visible.map((cat) => {
          const budgetW = max > 0 ? (cat.budgetAmount / max) * 100 : 0;
          const spentW = max > 0 ? Math.min((cat.totalSpent / max) * 100, 100) : 0;
          const over = cat.totalSpent > cat.budgetAmount;
          const pct = cat.budgetAmount > 0 ? Math.round((cat.totalSpent / cat.budgetAmount) * 100) : null;
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryClick(isActive ? null : cat.id)}
              className={`flex items-center gap-3 w-full rounded-xl px-2 py-2 transition-colors text-left ${
                isActive ? "bg-green-50 ring-1 ring-[#22C55E]/30" : "hover:bg-gray-50"
              }`}
            >
              {/* Label */}
              <div className="w-24 flex items-center gap-1.5 flex-shrink-0">
                {cat.emoji && <span className="text-base leading-none">{cat.emoji}</span>}
                <span className="text-xs font-medium text-gray-700 truncate">{cat.name}</span>
              </div>
              {/* Bar zone */}
              <div className="flex-1 relative h-3 rounded-full overflow-hidden bg-gray-100">
                <div
                  className="absolute top-0 left-0 h-full rounded-full bg-[#22C55E] opacity-30 transition-[width] duration-500"
                  style={{ width: animated ? `${budgetW}%` : "0%" }}
                />
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-[width] duration-500 ${over ? "bg-red-400" : "bg-amber-400"}`}
                  style={{ width: animated ? `${spentW}%` : "0%" }}
                />
              </div>
              {/* Value */}
              <div className="w-20 flex-shrink-0 text-right">
                <span className={`text-xs font-semibold ${over ? "text-red-500" : "text-gray-700"}`}>
                  {formatCurrency(cat.totalSpent)}
                </span>
                {pct !== null && (
                  <span className="text-[10px] text-gray-400 block">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {activeCategoryId && (
        <button
          onClick={() => onCategoryClick(null)}
          className="mt-2 text-xs text-[#22C55E] font-medium flex items-center gap-1 hover:underline"
        >
          <span>×</span> Clear filter
        </button>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [weekNumber, setWeekNumber] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);

  const initialKey = getHistoryCacheKey(now.getMonth() + 1, now.getFullYear(), null, null);
  const [data, setData] = useState<HistoryData | null>(
    () => getCachedHistory(initialKey) as HistoryData | null
  );
  const [loading, setLoading] = useState(!getCachedHistory(initialKey));

  const fetchHistory = useCallback(async (force = false) => {
    const key = getHistoryCacheKey(month, year, weekNumber, categoryFilter);
    const cached = getCachedHistory(key) as HistoryData | null;
    if (!force && isHistoryCacheFresh(key)) {
      setData(cached);
      setLoading(false);
      return;
    }
    // Show cached data immediately while refetching in background
    if (cached) setData(cached);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });
      if (weekNumber !== null) params.set("weekNumber", String(weekNumber));
      if (categoryFilter !== null) params.set("categoryId", String(categoryFilter));

      const res = await fetch(`/api/history?${params}`);
      if (!res.ok) return;
      const result = await res.json();
      setCachedHistory(key, result);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  }, [month, year, weekNumber, categoryFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleMonthNavigate = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
    setWeekNumber(null);
    setCategoryFilter(null);
  };

  const grandTotal = data?.categories.filter((cat) => !cat.isSystem).reduce((sum, cat) => sum + cat.totalSpent, 0) || 0;
  const totalIncome = data?.budget?.monthlyIncome ?? 0;

  return (
    <div className="bg-[#F5F7FA]">
      <Header
        currentTab="history"
        budgetMonth={data?.budget?.month}
        budgetYear={data?.budget?.year}
      />

      <main className="max-w-2xl mx-auto px-4 py-4 pb-8 space-y-3">
        <MonthNavigator month={month} year={year} onNavigate={handleMonthNavigate} />

        {data?.weeks && data.weeks.length > 0 && (
          <WeekNavigator
            weekNumber={weekNumber}
            weeks={data.weeks}
            onNavigate={setWeekNumber}
          />
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#22C55E] border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && !data?.budget && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-400">No budget found for this month.</p>
          </div>
        )}

        {!loading && data?.budget && (
          <>
            {/* Income / Expense summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-500">Income</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l7-7m-7 7l-7-7" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-500">Expense</p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(grandTotal)}</p>
              </div>
            </div>

            {/* Bar chart */}
            <SpendingBarChart
              categories={data.categories}
              activeCategoryId={categoryFilter}
              onCategoryClick={setCategoryFilter}
            />

            {/* Donut + total */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
              <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="#22C55E" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={totalIncome > 0 ? 2 * Math.PI * 40 * (1 - Math.min(grandTotal / totalIncome, 1)) : 2 * Math.PI * 40}
                    transform="rotate(-90 50 50)"
                    className="donut-progress"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">
                  Expense Total {weekNumber ? `· Week ${weekNumber}` : "this month"}
                </p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(grandTotal)}</p>
              </div>
            </div>

            {/* Category filter */}
            <div className="flex justify-center">
              <select
                value={categoryFilter ?? ""}
                onChange={(e) =>
                  setCategoryFilter(e.target.value ? parseInt(e.target.value) : null)
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#22C55E] focus:outline-none shadow-sm"
              >
                <option value="">All Categories</option>
                {data.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Top Spending */}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Top Spending</p>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 divide-y divide-gray-50">
              {data.categories
                .filter((cat) => !categoryFilter || cat.id === categoryFilter)
                .map((cat) => {
                  const iconColor = getCategoryColor(cat.name);
                  const initial = cat.name.charAt(0).toUpperCase();
                  return (
                    <div key={cat.id} className="py-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: iconColor }}
                        >
                          {cat.emoji ?? initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.totalSpent)}</span>
                          </div>
                          <span className={`text-xs ${cat.type === "weekly" ? "text-blue-400" : "text-purple-400"}`}>
                            {cat.type}
                          </span>
                        </div>
                      </div>
                      <ExpenseList expenses={cat.expenses} onRefresh={() => fetchHistory(true)} />
                    </div>
                  );
                })}

              {data.categories.length === 0 && (
                <p className="text-gray-400 text-center py-6">No expenses found.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
