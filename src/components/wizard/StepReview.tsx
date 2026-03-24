"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { WizardCategoryWithBudget } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface StepReviewProps {
  monthlyIncome: number;
  categories: WizardCategoryWithBudget[];
  onBack: () => void;
  editMode?: boolean;
  budgetId?: number;
}

export default function StepReview({
  monthlyIncome,
  categories,
  onBack,
  editMode = false,
  budgetId,
}: StepReviewProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const totalAllocated = categories.reduce(
    (sum, cat) => sum + (cat.type === "weekly" ? cat.budgetAmount * 4.33 : cat.budgetAmount),
    0
  );
  const remaining = monthlyIncome - totalAllocated;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editMode && budgetId) {
        // Update existing budget
        await fetch("/api/budget", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budgetId,
            monthlyIncome,
            categories: categories.map((cat) => ({
              id: (cat as WizardCategoryWithBudget & { id?: number }).id,
              budgetAmount: cat.budgetAmount,
            })),
          }),
        });
      } else {
        // Create new budget
        const now = new Date();
        await fetch("/api/budget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthlyIncome,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            categories: categories.map((cat) => ({
              name: cat.name,
              type: cat.type,
              budgetAmount: cat.budgetAmount,
            })),
          }),
        });
      }
      router.push("/");
    } catch (error) {
      console.error("Failed to save budget:", error);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Review Your Budget</h2>
        <p className="text-gray-500 mt-1">
          {editMode
            ? "Review your changes and save."
            : "Everything look good? Save to start tracking your expenses."}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-600">Monthly Income</p>
        <p className="text-3xl font-bold text-blue-900">
          {formatCurrency(monthlyIncome)}
        </p>
      </div>

      <div className="space-y-2">
        {categories.map((cat, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
          >
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
            <span className="font-semibold text-gray-900">
              {formatCurrency(cat.budgetAmount)}{cat.type === "weekly" ? "/week" : "/mo"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center bg-gray-100 rounded-lg px-4 py-3">
        <span className="font-medium text-gray-700">Unallocated</span>
        <span
          className={`font-bold ${
            remaining >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {formatCurrency(remaining)}
        </span>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : editMode ? "Update Budget" : "Save Budget"}
        </Button>
      </div>
    </div>
  );
}
