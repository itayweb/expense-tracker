"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ExpenseItem } from "@/lib/types";

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onRefresh: () => void;
  showDelete?: boolean;
}

function toDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function ExpenseList({ expenses, onRefresh, showDelete = true }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editRecurring, setEditRecurring] = useState(false);
  const [editRecurringInterval, setEditRecurringInterval] = useState<"weekly" | "monthly">("monthly");
  const [saving, setSaving] = useState(false);

  const startEdit = (expense: ExpenseItem) => {
    setEditingId(expense.id);
    setEditAmount(String(expense.amount));
    setEditDescription(expense.description);
    setEditDate(toDateInput(expense.date));
    setEditRecurring(expense.recurring);
    setEditRecurringInterval((expense.recurringInterval as "weekly" | "monthly") ?? "monthly");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRecurring(false);
    setEditRecurringInterval("monthly");
  };

  const saveEdit = async (id: number) => {
    setSaving(true);
    try {
      await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          description: editDescription,
          date: new Date(editDate).toISOString(),
          recurring: editRecurring,
          recurringInterval: editRecurring ? editRecurringInterval : null,
        }),
      });
      setEditingId(null);
      onRefresh();
    } catch (error) {
      console.error("Failed to update expense:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  if (expenses.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">No expenses yet</p>;
  }

  return (
    <div className="space-y-1">
      {expenses.map((expense) =>
        editingId === expense.id ? (
          <div key={expense.id} className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                step={0.01}
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-right text-gray-900 focus:border-[#22C55E] focus:outline-none"
                placeholder="Amount"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 focus:border-[#22C55E] focus:outline-none"
                placeholder="Description"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 focus:border-[#22C55E] focus:outline-none"
              />
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editRecurring}
                  onChange={(e) => setEditRecurring(e.target.checked)}
                  className="rounded border-gray-300 text-[#22C55E] focus:ring-[#22C55E]"
                />
                <span className="text-xs text-gray-600">Recurring</span>
              </label>
              {editRecurring && (
                <select
                  value={editRecurringInterval}
                  onChange={(e) => setEditRecurringInterval(e.target.value as "weekly" | "monthly")}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 focus:border-[#22C55E] focus:outline-none"
                >
                  <option value="weekly">Every week</option>
                  <option value="monthly">Every month</option>
                </select>
              )}
              <button
                onClick={() => saveEdit(expense.id)}
                disabled={saving}
                className="text-xs bg-[#22C55E] text-white px-2.5 py-1 rounded-lg hover:bg-[#16A34A] disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            key={expense.id}
            className="flex items-center justify-between text-sm py-2 group cursor-pointer rounded-xl hover:bg-gray-50 px-2 transition-colors"
            onClick={() => startEdit(expense)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-gray-800 truncate">{expense.description}</p>
                {expense.recurring && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 shrink-0">
                    {expense.recurringInterval === "weekly" ? "weekly" : "monthly"}
                  </span>
                )}
                {expense.tripName && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 shrink-0">
                    {expense.tripName}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {new Date(expense.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span className="font-semibold text-red-500">
                -{formatCurrency(expense.amount)}
              </span>
              {showDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors opacity-0 group-hover:opacity-100"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
