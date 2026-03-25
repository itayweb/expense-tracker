"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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

  const handleDeleteExpense = async (id: number) => {
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={trip.name} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!editing && (
              <span className="text-sm text-gray-500">
                {trip.startDate
                  ? new Date(trip.startDate).toLocaleDateString()
                  : "No start date"}
                {trip.endDate && ` — ${new Date(trip.endDate).toLocaleDateString()}`}
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                trip.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {trip.status}
            </span>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-blue-500 hover:text-blue-700 underline"
            >
              Edit dates
            </button>
          )}
        </div>

        {editing && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
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

        <div className="bg-teal-50 rounded-lg px-4 py-3">
          <span className="text-sm text-teal-600">Total Spent</span>
          <p className="text-2xl font-bold text-teal-900">
            {formatCurrency(trip.totalSpent)}
          </p>
        </div>

        {trip.expenses.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">No expenses yet</p>
        ) : (
          <div className="space-y-2">
            {trip.expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between text-sm py-1.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 truncate">{expense.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="font-medium text-gray-700">
                    {formatCurrency(expense.amount)}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="text-gray-300 hover:text-red-500 text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex gap-2">
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
                ? "bg-red-600 text-white hover:bg-red-700"
                : "text-red-500 hover:text-red-700 hover:bg-red-50"
            }`}
          >
            {deleting ? "Deleting..." : confirmDelete ? "Confirm delete" : "Delete trip"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
