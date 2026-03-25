"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { TripItem, CategoryWithExpenses } from "@/lib/types";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: number;
  categoryName?: string;
  categories?: CategoryWithExpenses[];
  onSaved: () => void;
  defaultTripId?: number;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  categoryId: initialCategoryId,
  categoryName,
  categories,
  onSaved,
  defaultTripId,
}: AddExpenseModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategoryId ? String(initialCategoryId) : ""
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<"weekly" | "monthly">("monthly");
  const [tripId, setTripId] = useState<string>(defaultTripId ? String(defaultTripId) : "");
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Determine effective categoryId
  const effectiveCategoryId = initialCategoryId
    ? String(initialCategoryId)
    : selectedCategoryId;

  useEffect(() => {
    if (isOpen) {
      fetch("/api/trips?status=active")
        .then((res) => res.json())
        .then((data) => setTrips(data))
        .catch(() => setTrips([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (defaultTripId) {
      setTripId(String(defaultTripId));
    }
  }, [defaultTripId]);

  const handleClose = () => {
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setRecurring(false);
    setRecurringInterval("monthly");
    setTripId(defaultTripId ? String(defaultTripId) : "");
    if (!initialCategoryId) setSelectedCategoryId("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !effectiveCategoryId) return;

    setSaving(true);
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          date: new Date(date).toISOString(),
          categoryId: parseInt(effectiveCategoryId),
          recurring,
          recurringInterval: recurring ? recurringInterval : null,
          tripId: tripId ? parseInt(tripId) : null,
        }),
      });
      handleClose();
      onSaved();
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = categoryName
    ? `Add Expense — ${categoryName}`
    : "Add Expense";

  const canSubmit = !saving && !!amount && !!description && !!effectiveCategoryId;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!initialCategoryId && categories && categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type})
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          id="expense-amount"
          label="Amount (₪)"
          type="number"
          min={0}
          step={0.01}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
        <Input
          id="expense-description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this expense for?"
        />
        <Input
          id="expense-date"
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {trips.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trip (optional)
            </label>
            <select
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">No trip</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Recurring expense</span>
          </label>
          {recurring && (
            <select
              value={recurringInterval}
              onChange={(e) => setRecurringInterval(e.target.value as "weekly" | "monthly")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="weekly">Every week</option>
              <option value="monthly">Every month</option>
            </select>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {saving ? "Saving..." : "Add Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
