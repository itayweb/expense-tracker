"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { WizardCategoryWithBudget, CategoryType } from "@/lib/types";

interface StepIncomeSimplifiedProps {
  income: number;
  onChange: (income: number) => void;
  previousIncome: number;
  categories: WizardCategoryWithBudget[];
  onCategoriesChange: (cats: WizardCategoryWithBudget[]) => void;
  onNext: (incomeChanged: boolean) => void;
  monthName: string;
}

export default function StepIncomeSimplified({
  income,
  onChange,
  previousIncome,
  categories,
  onCategoriesChange,
  onNext,
  monthName,
}: StepIncomeSimplifiedProps) {
  const [expanded, setExpanded] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CategoryType>("monthly");

  const incomeChanged = income !== previousIncome;

  const updateAmount = (index: number, amount: number) => {
    onCategoriesChange(
      categories.map((cat, i) => (i === index ? { ...cat, budgetAmount: amount } : cat))
    );
  };

  const removeCategory = (index: number) => {
    onCategoriesChange(categories.filter((_, i) => i !== index));
  };

  const addCategory = () => {
    if (newName.trim()) {
      onCategoriesChange([
        ...categories,
        { name: newName.trim(), type: newType, budgetAmount: 0 },
      ]);
      setNewName("");
    }
  };

  const handleContinue = () => {
    onNext(incomeChanged);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Start {monthName}</h2>
        <p className="text-gray-500 mt-1">
          Your categories carry over automatically. Just confirm your income.
        </p>
      </div>

      <div className="max-w-xs space-y-1">
        <Input
          id="income"
          label="Monthly Income (₪)"
          type="number"
          min={0}
          step={100}
          value={income || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="e.g. 5000"
        />
        {incomeChanged && income > 0 && (
          <p className="text-xs text-amber-600">
            Income changed — AI will re-suggest your category budgets
          </p>
        )}
      </div>

      {/* Collapsible categories section */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <span className="text-sm font-medium text-gray-700">
            Categories ({categories.length})
          </span>
          <span className="text-gray-400 text-xs">{expanded ? "▲ Hide" : "▼ Edit"}</span>
        </button>

        {expanded && (
          <div className="p-4 space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((cat, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100"
                >
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="font-medium text-gray-800 truncate">
                      {cat.emoji ?? ""} {cat.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        cat.type === "weekly"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-purple-50 text-purple-600"
                      }`}
                    >
                      {cat.type}
                    </span>
                  </div>
                  {!incomeChanged && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-gray-400 text-sm">₪</span>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={cat.budgetAmount || ""}
                        onChange={(e) => updateAmount(index, parseFloat(e.target.value) || 0)}
                        className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm text-gray-800 focus:border-[#22C55E] focus:outline-none"
                      />
                      <span className="text-xs text-gray-400 w-8">
                        /{cat.type === "weekly" ? "wk" : "mo"}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeCategory(index)}
                    className="text-gray-400 hover:text-red-400 text-lg transition-colors shrink-0"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  id="new-category"
                  label="Add Category"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Category name"
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
              </div>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CategoryType)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 focus:border-[#22C55E] focus:outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
              <Button onClick={addCategory} disabled={!newName.trim()}>
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleContinue} disabled={income <= 0 || categories.length === 0}>
        Continue
      </Button>
    </div>
  );
}
