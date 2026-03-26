"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ExpenseItem } from "@/lib/types";

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onRefresh: () => void;
}

function toDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function ExpenseList({ expenses, onRefresh }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (expense: ExpenseItem) => {
    setEditingId(expense.id);
    setEditAmount(String(expense.amount));
    setEditDescription(expense.description);
    setEditDate(toDateInput(expense.date));
  };

  const cancelEdit = () => setEditingId(null);

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
    return <p className="text-sm text-gray-400 text-center py-2">No expenses yet</p>;
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) =>
        editingId === expense.id ? (
          <div key={expense.id} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                step={0.01}
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-24 rounded border border-gray-300 px-2 py-1 text-sm text-right text-gray-900 focus:border-blue-500 focus:outline-none"
                placeholder="Amount"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                placeholder="Description"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={() => saveEdit(expense.id)}
                disabled={saving}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            key={expense.id}
            className="flex items-center justify-between text-sm py-1.5 group cursor-pointer rounded hover:bg-gray-50 px-1"
            onClick={() => startEdit(expense)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-gray-900 truncate">{expense.description}</p>
                {expense.recurring && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                    {expense.recurringInterval === "weekly" ? "weekly" : "monthly"}
                  </span>
                )}
                {expense.tripName && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 shrink-0">
                    {expense.tripName}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {new Date(expense.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <span className="font-medium text-gray-700">
                {formatCurrency(expense.amount)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }}
                className="text-gray-300 hover:text-red-500 text-lg leading-none"
              >
                &times;
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
