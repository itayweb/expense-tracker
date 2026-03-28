"use client";

import { useState } from "react";
import StepIncome from "./StepIncome";
import StepCategories from "./StepCategories";
import StepAISuggestions from "./StepAISuggestions";
import StepReview from "./StepReview";
import Header from "@/components/layout/Header";
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

  const STEPS = ["Income", "Categories", "AI Budget", "Review"];

  const [step, setStep] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(
    isEdit ? existingBudget.monthlyIncome : 0
  );
  const [categories, setCategories] = useState<WizardCategory[]>(
    isEdit
      ? existingBudget.categories
          .filter((c) => !c.isSystem)
          .map((c) => ({ name: c.name, emoji: c.emoji, type: c.type as "weekly" | "monthly" }))
      : []
  );
  const [budgetCategories, setBudgetCategories] = useState<WizardCategoryWithBudget[]>(
    isEdit
      ? existingBudget.categories
          .filter((c) => !c.isSystem)
          .map((c) => ({
            name: c.name,
            emoji: c.emoji,
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
      const existingByKey = new Map(
        budgetCategories.map((bc) => [`${bc.name}::${bc.type}`, bc])
      );
      const newCategories = categories.map((c) => {
        const key = `${c.name}::${c.type}`;
        const existing = existingByKey.get(key);
        return existing || { ...c, budgetAmount: 0 };
      });

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
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-4 pb-8 space-y-3">
        {/* Title */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <h1 className="text-lg font-bold text-gray-900">
            {isEdit ? "Edit Budget" : "Budget Setup"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isEdit
              ? "Adjust your income, categories, and allocations"
              : "Set up your monthly budget in a few simple steps"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((label, index) => (
              <div key={label} className="flex items-center gap-1 flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      index < step
                        ? "bg-[#22C55E] text-white"
                        : index === step
                        ? "bg-[#22C55E] text-white ring-4 ring-[#22C55E]/20"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {index < step ? "✓" : index + 1}
                  </div>
                  <span
                    className={`text-xs hidden sm:inline ${
                      index === step ? "text-[#22C55E] font-semibold" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 ${index < step ? "bg-[#22C55E]" : "bg-gray-100"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-6">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
