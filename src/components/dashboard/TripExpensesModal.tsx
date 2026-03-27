"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AddExpenseModal from "./AddExpenseModal";
import ExpenseList from "./ExpenseList";
import { TripItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface TripExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripItem;
  onRefresh: () => void;
}

function toDateInput(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function TripExpensesModal({
  isOpen,
  onClose,
  trip,
  onRefresh,
}: TripExpensesModalProps) {
  const [completing, setCompleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState(toDateInput(trip.startDate));
  const [endDate, setEndDate] = useState(toDateInput(trip.endDate));
  const [savingDates, setSavingDates] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await fetch(`/api/trips/${trip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      onClose();
      onRefresh();
    } catch (error) {
      console.error("Failed to complete trip:", error);
    } finally {
      setCompleting(false);
    }
  };

  const handleReactivate = async () => {
    try {
      await fetch(`/api/trips/${trip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      onRefresh();
    } catch (error) {
      console.error("Failed to reactivate trip:", error);
    }
  };

  const handleSaveDates = async () => {
    setSavingDates(true);
    try {
      await fetch(`/api/trips/${trip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null,
        }),
      });
      setEditing(false);
      onRefresh();
    } catch (error) {
      console.error("Failed to save dates:", error);
    } finally {
      setSavingDates(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
      onClose();
      onRefresh();
    } catch (error) {
      console.error("Failed to delete trip:", error);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={trip.name} size="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!editing && (
                <span className="text-sm text-slate-400">
                  {trip.startDate
                    ? new Date(trip.startDate).toLocaleDateString()
                    : "No start date"}
                  {trip.endDate && ` — ${new Date(trip.endDate).toLocaleDateString()}`}
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  trip.status === "active"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-white/[0.08] text-slate-400"
                }`}
              >
                {trip.status}
              </span>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline transition-colors"
              >
                Edit dates
              </button>
            )}
          </div>

          {editing && (
            <div className="bg-[#242442] rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="trip-start-date"
                  label="Start date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  id="trip-end-date"
                  label="End date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveDates} disabled={savingDates}>
                  {savingDates ? "Saving..." : "Save dates"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    setStartDate(toDateInput(trip.startDate));
                    setEndDate(toDateInput(trip.endDate));
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
            <span className="text-sm text-emerald-400">Total Spent</span>
            <p className="text-2xl font-bold text-emerald-300">
              {formatCurrency(trip.totalSpent)}
            </p>
          </div>

          <ExpenseList expenses={trip.expenses} onRefresh={onRefresh} />

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowAddExpense(true)}>
                + Add Expense
              </Button>
              {trip.status === "active" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleComplete}
                  disabled={completing}
                >
                  {completing ? "Completing..." : "Mark Completed"}
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={handleReactivate}>
                  Reactivate
                </Button>
              )}
            </div>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                confirmDelete
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
              }`}
            >
              {deleting ? "Deleting..." : confirmDelete ? "Confirm delete" : "Delete trip"}
            </button>
          </div>
        </div>
      </Modal>

      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        defaultTripId={trip.id}
        onSaved={() => {
          setShowAddExpense(false);
          onRefresh();
        }}
      />
    </>
  );
}
