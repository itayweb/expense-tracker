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
      <div className="text-center py-12 text-gray-500">
        No categories yet. Set up your budget in the wizard.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
