"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { WizardCategory, CategoryType } from "@/lib/types";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

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
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      onChange(DEFAULT_CATEGORIES);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pickerForIndex === null) return;
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      // Close on outside click (best-effort; picker is rendered inline)
      if (!el.closest?.("[data-emoji-picker-root]")) {
        setPickerForIndex(null);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [pickerForIndex]);

  const currentCategories =
    categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const addCategory = () => {
    if (newName.trim()) {
      onChange([
        ...currentCategories,
        { name: newName.trim(), type: newType, emoji: undefined },
      ]);
      setNewName("");
    }
  };

  const removeCategory = (index: number) => {
    onChange(currentCategories.filter((_, i) => i !== index));
  };

  const setEmojiFor = (index: number, emoji: string) => {
    onChange(
      currentCategories.map((c, i) => (i === index ? { ...c, emoji } : c))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">
          Set up your expense categories
        </h2>
        <p className="text-slate-400 mt-1">
          Add or remove categories. Mark each as weekly or monthly.
        </p>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {currentCategories.map((cat, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-[#242442] rounded-lg px-4 py-2"
          >
            <div className="flex items-center gap-3">
              <div className="relative" data-emoji-picker-root>
                <button
                  type="button"
                  onClick={() =>
                    setPickerForIndex((prev) => (prev === index ? null : index))
                  }
                  className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] flex items-center justify-center text-base leading-none"
                  aria-label="Pick emoji"
                  title="Pick emoji"
                >
                  {cat.emoji ?? "📦"}
                </button>
                {pickerForIndex === index && (
                  <div className="absolute left-0 top-11 z-50">
                    <div className="rounded-xl overflow-hidden border border-white/[0.12] shadow-xl shadow-black/40">
                      <EmojiPicker
                        theme={Theme.DARK}
                        skinTonesDisabled
                        searchDisabled={false}
                        onEmojiClick={(emojiData: EmojiClickData) => {
                          setEmojiFor(index, emojiData.emoji);
                          setPickerForIndex(null);
                        }}
                        width={320}
                        height={360}
                      />
                    </div>
                  </div>
                )}
              </div>

              <span className="font-medium text-slate-100">{cat.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  cat.type === "weekly"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-purple-500/15 text-purple-400"
                }`}
              >
                {cat.type}
              </span>
            </div>
            <button
              onClick={() => removeCategory(index)}
              className="text-slate-500 hover:text-red-400 text-lg transition-colors"
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
          className="rounded-xl border border-white/[0.15] bg-[#242442] px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
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
