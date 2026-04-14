"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTripModal({
  isOpen,
  onClose,
  onCreated,
}: CreateTripModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });
      setName("");
      setStartDate("");
      setEndDate("");
      onClose();
      onCreated();
    } catch (error) {
      console.error("Failed to create trip:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Trip">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="trip-name"
          label="Trip Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Japan 2026"
        />
        <Input
          id="trip-start"
          label="Start Date (optional)"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          id="trip-end"
          label="End Date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name.trim()} data-testid="create-trip-submit">
            {saving ? "Creating..." : "Create Trip"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
