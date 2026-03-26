"use client";

import { useEffect, useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import { WizardCategory, WizardCategoryWithBudget, BudgetSuggestion } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface StepAISuggestionsProps {
  monthlyIncome: number;
  categories: WizardCategory[];
  budgetCategories: WizardCategoryWithBudget[];
  onChange: (categories: WizardCategoryWithBudget[]) => void;
  onNext: () => void;
  onBack: () => void;
  editMode?: boolean;
}

export default function StepAISuggestions({
  monthlyIncome,
  categories,
  budgetCategories,
  onChange,
  onNext,
  onBack,
  editMode = false,
}: StepAISuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyIncome, categories, existingAmounts: budgetCategories }),
      });
      const data = await res.json();
      setSource(data.source);

      const merged: WizardCategoryWithBudget[] = categories.map((cat) => {
        const suggestion = (data.suggestions as BudgetSuggestion[]).find(
          (s) => s.name.toLowerCase() === cat.name.toLowerCase()
        );
        const existing = budgetCategories.find(
          (bc) => bc.name === cat.name && bc.type === cat.type
        );
        return {
          ...cat,
          id: existing?.id,
          budgetAmount: suggestion?.suggestedAmount ?? existing?.budgetAmount ?? 0,
        };
      });
      onChange(merged);
    } catch {
      setError("Failed to get suggestions. You can set amounts manually.");
      onChange(
        categories.map((cat) => {
          const existing = budgetCategories.find(
            (bc) => bc.name === cat.name && bc.type === cat.type
          );
          return {
            ...cat,
            id: existing?.id,
            budgetAmount: Math.floor(monthlyIncome / (categories.length + 1)),
          };
        })
      );
    } finally {
      setLoading(false);
    }
  }, [monthlyIncome, categories, onChange]);

  useEffect(() => {
    // In edit mode, categories are pre-filled — don't auto-fetch AI
    if (!editMode && budgetCategories.length === 0) {
      fetchSuggestions();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateAmount = (catId: number | undefined, catName: string, amount: number) => {
    const updated = budgetCategories.map((cat) => {
      const matches = catId ? cat.id === catId : (cat.name === catName);
      return matches ? { ...cat, budgetAmount: amount } : cat;
    });
    onChange(updated);
  };

  // Convert to monthly equivalents for total calculation (exclude system categories)
  const regularBudgetCategories = budgetCategories.filter((cat) => !cat.isSystem);
  const totalAllocated = regularBudgetCategories.reduce(
    (sum, cat) => sum + (cat.type === "weekly" ? cat.budgetAmount * 4.33 : cat.budgetAmount),
    0
  );
  const remaining = monthlyIncome - totalAllocated;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Budget Allocation
        </h2>
        <p className="text-gray-500 mt-1">
          {editMode
            ? "Adjust your category allocations as needed."
            : source === "ai"
            ? "AI suggested these amounts. Adjust as needed."
            : source === "fallback"
            ? "AI was unavailable. Amounts were evenly distributed. Adjust as needed."
            : "Set your budget for each category."}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <span className="ml-3 text-gray-500">Asking AI for suggestions...</span>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm">
          {error}
        </div>
      )}

      {!loading && regularBudgetCategories.length > 0 && (
        <>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {regularBudgetCategories.map((cat, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{cat.name}</span>
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
                  {cat.type === "weekly" && (
                    <span className="text-xs text-gray-400">
                      ~{formatCurrency(Math.round(cat.budgetAmount * 4.33))}/month
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">₪</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={cat.budgetAmount || ""}
                    onChange={(e) =>
                      updateAmount(cat.id, cat.name, parseFloat(e.target.value) || 0)
                    }
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-right text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-400 w-12">
                    /{cat.type === "weekly" ? "week" : "mo"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`rounded-lg p-4 ${
              remaining >= 0
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Monthly Income</span>
              <span className="font-medium">{formatCurrency(monthlyIncome)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Total Allocated</span>
              <span className="font-medium">{formatCurrency(totalAllocated)}</span>
            </div>
            <hr className="my-2 border-gray-200" />
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Remaining</span>
              <span
                className={`font-bold ${
                  remaining >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        {!loading && (
          <Button variant="secondary" onClick={fetchSuggestions}>
            Retry AI
          </Button>
        )}
        <Button onClick={onNext} disabled={loading || budgetCategories.length === 0}>
          Review
        </Button>
      </div>
    </div>
  );
}
