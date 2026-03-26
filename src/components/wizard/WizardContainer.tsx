"use client";

import { useState } from "react";
import StepIncome from "./StepIncome";
import StepCategories from "./StepCategories";
import StepAISuggestions from "./StepAISuggestions";
import StepReview from "./StepReview";
import { WizardCategory, WizardCategoryWithBudget, BudgetWithCategories } from "@/lib/types";

interface WizardContainerProps {
  mode?: "create" | "edit";
  existingBudget?: BudgetWithCategories | null;
}

export default function WizardContainer({
  mode = "create",
  existingBudget,
}: WizardContainerProps) {
  const isEdit = mode === "edit" && existingBudget;

  // Both modes: full 4-step flow
  const STEPS = ["Income", "Categories", "AI Budget", "Review"];

  const [step, setStep] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(
    isEdit ? existingBudget.monthlyIncome : 0
  );
  const [categories, setCategories] = useState<WizardCategory[]>(
    isEdit
      ? existingBudget.categories
          .filter((c) => !c.isSystem)
          .map((c) => ({ name: c.name, type: c.type as "weekly" | "monthly" }))
      : []
  );
  const [budgetCategories, setBudgetCategories] = useState<WizardCategoryWithBudget[]>(
    isEdit
      ? existingBudget.categories
          .filter((c) => !c.isSystem)
          .map((c) => ({
            name: c.name,
            type: c.type as "weekly" | "monthly",
            budgetAmount: c.budgetAmount,
            id: c.id,
          }))
      : []
  );
  const [budgetId] = useState(isEdit ? existingBudget.id : null);
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<number[]>([]);

  const handleCategoriesNext = () => {
    if (isEdit) {
      // Merge: keep existing budget data for categories that still exist, add new ones with 0 budget
      const existingByKey = new Map(
        budgetCategories.map((bc) => [`${bc.name}::${bc.type}`, bc])
      );
      const newCategories = categories.map((c) => {
        const key = `${c.name}::${c.type}`;
        const existing = existingByKey.get(key);
        return existing || { ...c, budgetAmount: 0 };
      });

      // Track deleted categories that had an id
      const remainingKeys = new Set(categories.map((c) => `${c.name}::${c.type}`));
      const deleted = budgetCategories
        .filter((bc) => bc.id && !remainingKeys.has(`${bc.name}::${bc.type}`))
        .map((bc) => bc.id!);
      setDeletedCategoryIds((prev) => [...new Set([...prev, ...deleted])]);

      setBudgetCategories(newCategories);
    } else {
      setBudgetCategories([]);
    }
    setStep(2);
  };

  // Unified 4-step flow: Income (0) → Categories (1) → AI Budget (2) → Review (3)
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepIncome
            income={monthlyIncome}
            onChange={setMonthlyIncome}
            onNext={() => setStep(1)}
          />
        );
      case 1:
        return (
          <StepCategories
            categories={categories}
            onChange={setCategories}
            onNext={handleCategoriesNext}
            onBack={() => setStep(0)}
          />
        );
      case 2:
        return (
          <StepAISuggestions
            monthlyIncome={monthlyIncome}
            categories={categories}
            budgetCategories={budgetCategories}
            onChange={setBudgetCategories}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            editMode={!!isEdit}
          />
        );
      case 3:
        return (
          <StepReview
            monthlyIncome={monthlyIncome}
            categories={budgetCategories}
            onBack={() => setStep(2)}
            editMode={!!isEdit}
            budgetId={budgetId ?? undefined}
            deletedCategoryIds={deletedCategoryIds}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? "Edit Budget" : "Budget Wizard"}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEdit
              ? "Adjust your income, categories, and allocations"
              : "Set up your monthly budget in a few simple steps"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= step
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  index <= step ? "text-blue-600 font-medium" : "text-gray-400"
                }`}
              >
                {label}
              </span>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    index < step ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
