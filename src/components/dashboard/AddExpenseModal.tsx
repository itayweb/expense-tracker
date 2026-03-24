"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number;
  categoryName: string;
  onSaved: () => void;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  onSaved,
}: AddExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<"weekly" | "monthly">("monthly");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setSaving(true);
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          date: new Date(date).toISOString(),
          categoryId,
          recurring,
          recurringInterval: recurring ? recurringInterval : null,
        }),
      });
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setRecurring(false);
      setRecurringInterval("monthly");
      onClose();
      onSaved();
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Expense — ${categoryName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !amount || !description}>
            {saving ? "Saving..." : "Add Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
