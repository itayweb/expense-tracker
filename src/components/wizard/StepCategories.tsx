"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { WizardCategory, CategoryType } from "@/lib/types";

interface StepCategoriesProps {
  categories: WizardCategory[];
  onChange: (categories: WizardCategory[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const DEFAULT_CATEGORIES: WizardCategory[] = [
  { name: "Rent/Mortgage", type: "monthly" },
  { name: "Utilities", type: "monthly" },
  { name: "Groceries", type: "weekly" },
  { name: "Dining Out", type: "weekly" },
  { name: "Transportation", type: "monthly" },
  { name: "Entertainment", type: "weekly" },
  { name: "Savings", type: "monthly" },
];

export default function StepCategories({
  categories,
  onChange,
  onNext,
  onBack,
}: StepCategoriesProps) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<CategoryType>("monthly");

  useEffect(() => {
    if (categories.length === 0) {
      onChange(DEFAULT_CATEGORIES);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentCategories =
    categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const addCategory = () => {
    if (newName.trim()) {
      onChange([...currentCategories, { name: newName.trim(), type: newType }]);
      setNewName("");
    }
  };

  const removeCategory = (index: number) => {
    onChange(currentCategories.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Set up your expense categories
        </h2>
        <p className="text-gray-500 mt-1">
          Add or remove categories. Mark each as weekly or monthly.
        </p>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {currentCategories.map((cat, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2"
          >
            <div className="flex items-center gap-3">
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
            <button
              onClick={() => removeCategory(index)}
              className="text-gray-400 hover:text-red-500 text-lg"
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
            label="New Category"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
        </div>
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as CategoryType)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
        >
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
        </select>
        <Button onClick={addCategory} disabled={!newName.trim()}>
          Add
        </Button>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={currentCategories.length === 0}>
          Get AI Suggestions
        </Button>
      </div>
    </div>
  );
}
