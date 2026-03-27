"use client";

import { CategoryWithExpenses } from "@/lib/types";
import CategoryCard from "./CategoryCard";

interface CategoryGridProps {
  categories: CategoryWithExpenses[];
  onRefresh: () => void;
}

export default function CategoryGrid({ categories, onRefresh }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No categories yet. Set up your budget in the wizard.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 divide-y divide-gray-50">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
