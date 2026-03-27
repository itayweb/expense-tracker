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
      <Card className="flex flex-col cursor-pointer hover:border-white/[0.15] hover:shadow-xl hover:shadow-black/30 transition-all">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-100">{trip.name}</h3>
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

        {trip.startDate && (
          <p className="text-xs text-slate-500 mb-2">
            {new Date(trip.startDate).toLocaleDateString()}
            {trip.endDate && ` — ${new Date(trip.endDate).toLocaleDateString()}`}
          </p>
        )}

        <div className="mt-auto">
          <p className="text-sm text-slate-400">Total spent</p>
          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(trip.totalSpent)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
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
