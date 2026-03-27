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
    return <p className="text-sm text-slate-500 text-center py-2">No expenses yet</p>;
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) =>
        editingId === expense.id ? (
          <div key={expense.id} className="bg-[#242442] border border-emerald-500/30 rounded-lg px-3 py-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                step={0.01}
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-24 rounded-lg border border-white/[0.15] bg-[#2A2A4A] px-2 py-1 text-sm text-right text-slate-100 focus:border-emerald-500 focus:outline-none"
                placeholder="Amount"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="flex-1 rounded-lg border border-white/[0.15] bg-[#2A2A4A] px-2 py-1 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                placeholder="Description"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="rounded-lg border border-white/[0.15] bg-[#2A2A4A] px-2 py-1 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editRecurring}
                  onChange={(e) => setEditRecurring(e.target.checked)}
                  className="rounded border-white/[0.2] bg-[#2A2A4A] text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-300">Recurring</span>
              </label>
              {editRecurring && (
                <select
                  value={editRecurringInterval}
                  onChange={(e) => setEditRecurringInterval(e.target.value as "weekly" | "monthly")}
                  className="rounded-lg border border-white/[0.15] bg-[#2A2A4A] px-2 py-1 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="weekly">Every week</option>
                  <option value="monthly">Every month</option>
                </select>
              )}
              <button
                onClick={() => saveEdit(expense.id)}
                disabled={saving}
                className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-white/[0.08] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            key={expense.id}
            className="flex items-center justify-between text-sm py-1.5 group cursor-pointer rounded-lg hover:bg-white/[0.05] px-1 transition-colors"
            onClick={() => startEdit(expense)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-slate-200 truncate">{expense.description}</p>
                {expense.recurring && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 shrink-0">
                    {expense.recurringInterval === "weekly" ? "weekly" : "monthly"}
                  </span>
                )}
                {expense.tripName && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-500/15 text-teal-400 shrink-0">
                    {expense.tripName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {new Date(expense.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span className="font-medium text-slate-300">
                {formatCurrency(expense.amount)}
              </span>
              {showDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }}
                  className="text-slate-500 hover:text-red-400 text-lg leading-none transition-colors"
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
