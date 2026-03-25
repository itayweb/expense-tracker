"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import { TripItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import TripExpensesModal from "./TripExpensesModal";

interface TripCardProps {
  trip: TripItem;
  onRefresh: () => void;
}

export default function TripCard({ trip, onRefresh }: TripCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div onClick={() => setShowModal(true)}>
      <Card className="flex flex-col cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{trip.name}</h3>
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

        {trip.startDate && (
          <p className="text-xs text-gray-400 mb-2">
            {new Date(trip.startDate).toLocaleDateString()}
            {trip.endDate && ` — ${new Date(trip.endDate).toLocaleDateString()}`}
          </p>
        )}

        <div className="mt-auto">
          <p className="text-sm text-gray-500">Total spent</p>
          <p className="text-lg font-bold text-teal-700">
            {formatCurrency(trip.totalSpent)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {trip.expenses.length} expense{trip.expenses.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>
      </div>

      <TripExpensesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        trip={trip}
        onRefresh={onRefresh}
      />
    </>
  );
}
