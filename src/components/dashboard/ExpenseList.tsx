"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { ExpenseItem } from "@/lib/types";

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onRefresh: () => void;
  showDelete?: boolean;
}

type ScopeDialog = {
  type: "delete" | "save";
  expenseId: number;
  recurringTemplateId: number;
};

function toDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function ExpenseList({ expenses, onRefresh, showDelete = true }: ExpenseListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [scopeDialog, setScopeDialog] = useState<ScopeDialog | null>(null);

  const startEdit = (expense: ExpenseItem) => {
    setEditingId(expense.id);
    setEditAmount(String(expense.amount));
    setEditDescription(expense.description);
    setEditDate(toDateInput(expense.date));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const doSave = async (id: number, scope: "single" | "future") => {
    setSaving(true);
    try {
      await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          description: editDescription,
          date: new Date(editDate).toISOString(),
          scope,
        }),
      });
      setEditingId(null);
      setScopeDialog(null);
      onRefresh();
    } catch (error) {
      console.error("Failed to update expense:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = (expense: ExpenseItem) => {
    if (expense.recurringTemplateId) {
      setScopeDialog({ type: "save", expenseId: expense.id, recurringTemplateId: expense.recurringTemplateId });
    } else {
      doSave(expense.id, "single");
    }
  };

  const doDelete = async (id: number, scope: "single" | "future") => {
    try {
      await fetch(`/api/expenses/${id}?scope=${scope}`, { method: "DELETE" });
      setScopeDialog(null);
      onRefresh();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  const handleDelete = (expense: ExpenseItem) => {
    if (expense.recurringTemplateId) {
      setScopeDialog({ type: "delete", expenseId: expense.id, recurringTemplateId: expense.recurringTemplateId });
    } else {
      doDelete(expense.id, "single");
    }
  };

  if (expenses.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4" data-testid="no-expenses">No expenses yet</p>;
  }

  return (
    <>
      <div className="space-y-1" data-testid="expense-list">
        {expenses.map((expense) =>
          editingId === expense.id ? (
            <div key={expense.id} className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 space-y-2" data-testid="expense-edit-row">
              <div className="flex gap-2">
                <input
                  data-testid="edit-amount-input"
                  type="number"
                  min={0}
                  step={0.01}
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-right text-gray-900 focus:border-[#22C55E] focus:outline-none"
                  placeholder="Amount"
                />
                <input
                  data-testid="edit-description-input"
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 focus:border-[#22C55E] focus:outline-none"
                  placeholder="Description"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  data-testid="edit-date-input"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 focus:border-[#22C55E] focus:outline-none"
                />
                <button
                  data-testid="expense-save-btn"
                  onClick={() => saveEdit(expense)}
                  disabled={saving}
                  className="text-xs bg-[#22C55E] text-white px-2.5 py-1 rounded-lg hover:bg-[#16A34A] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  data-testid="expense-cancel-btn"
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
              data-testid="expense-row"
              className="flex items-center justify-between text-sm py-2 group cursor-pointer rounded-xl hover:bg-gray-50 px-2 transition-colors"
              onClick={() => startEdit(expense)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-gray-800 truncate">{expense.description}</p>
                  {expense.recurringInterval && (
                    <span data-testid="recurring-badge" className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 shrink-0">
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
                    data-testid="expense-delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDelete(expense); }}
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

      {scopeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" data-testid="scope-dialog">
          <div className="bg-white rounded-2xl shadow-xl p-6 mx-4 max-w-sm w-full space-y-4">
            <h3 className="text-base font-semibold text-gray-900">
              {scopeDialog.type === "delete" ? "Delete recurring expense" : "Edit recurring expense"}
            </h3>
            <p className="text-sm text-gray-500">
              {scopeDialog.type === "delete"
                ? "Do you want to delete just this expense, or this and all future occurrences?"
                : "Do you want to update just this expense, or this and all future occurrences?"}
            </p>
            <div className="flex flex-col gap-2">
              <button
                data-testid="scope-single-btn"
                onClick={() =>
                  scopeDialog.type === "delete"
                    ? doDelete(scopeDialog.expenseId, "single")
                    : doSave(scopeDialog.expenseId, "single")
                }
                className="w-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-xl transition-colors"
              >
                Just this one
              </button>
              <button
                data-testid="scope-future-btn"
                onClick={() =>
                  scopeDialog.type === "delete"
                    ? doDelete(scopeDialog.expenseId, "future")
                    : doSave(scopeDialog.expenseId, "future")
                }
                className="w-full text-sm bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl transition-colors"
              >
                This and all future
              </button>
              <button
                data-testid="scope-cancel-btn"
                onClick={() => setScopeDialog(null)}
                className="w-full text-sm text-gray-400 hover:text-gray-600 px-4 py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
