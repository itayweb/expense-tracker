"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import MonthNavigator from "@/components/history/MonthNavigator";
import WeekNavigator from "@/components/history/WeekNavigator";
import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { ExpenseItem } from "@/lib/types";

interface HistoryCategory {
  id: number;
  name: string;
  type: string;
  budgetAmount: number;
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

export default function HistoryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [weekNumber, setWeekNumber] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });
      if (weekNumber !== null) params.set("weekNumber", String(weekNumber));
      if (categoryFilter !== null) params.set("categoryId", String(categoryFilter));

      const res = await fetch(`/api/history?${params}`);
      const result = await res.json();
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

  const grandTotal = data?.categories.reduce((sum, cat) => sum + cat.totalSpent, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentTab="history"
        budgetMonth={data?.budget?.month}
        budgetYear={data?.budget?.year}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <MonthNavigator month={month} year={year} onNavigate={handleMonthNavigate} />

        {data?.weeks && data.weeks.length > 0 && (
          <WeekNavigator
            weekNumber={weekNumber}
            weeks={data.weeks}
            onNavigate={setWeekNumber}
          />
        )}

        {/* Category filter */}
        {data?.categories && data.categories.length > 0 && (
          <div className="flex justify-center">
            <select
              value={categoryFilter ?? ""}
              onChange={(e) =>
                setCategoryFilter(e.target.value ? parseInt(e.target.value) : null)
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {data.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && !data?.budget && (
          <Card>
            <p className="text-gray-500 text-center py-8">
              No budget found for this month.
            </p>
          </Card>
        )}

        {!loading && data?.budget && (
          <>
            <Card className="text-center">
              <p className="text-sm text-gray-500">
                Total spent {weekNumber ? `in Week ${weekNumber}` : "this month"}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(grandTotal)}</p>
            </Card>

            {data.categories.map((cat) => (
              <Card key={cat.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        cat.type === "weekly"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {cat.type}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-700">
                    {formatCurrency(cat.totalSpent)}
                  </span>
                </div>

                {cat.expenses.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">No expenses</p>
                ) : (
                  <div className="space-y-2">
                    {cat.expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between text-sm py-1.5 border-t border-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-gray-900 truncate">{exp.description}</p>
                            {exp.recurring && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                                {exp.recurringInterval === "weekly" ? "weekly" : "monthly"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(exp.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-medium text-gray-700 ml-3">
                          {formatCurrency(exp.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}

            {data.categories.length === 0 && (
              <Card>
                <p className="text-gray-500 text-center py-4">No expenses found.</p>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
