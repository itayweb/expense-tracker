"use client";

import { useState } from "react";
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
      <div
        onClick={() => setShowModal(true)}
        className="flex items-center gap-3 py-3 px-1 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors group"
      >
        {/* Airplane icon circle */}
        <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-sm font-semibold text-gray-800 truncate">{trip.name}</p>
            <span className="text-sm font-bold text-gray-800 ml-2">
              {formatCurrency(trip.totalSpent)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "No dates"}
              {trip.endDate && ` — ${new Date(trip.endDate).toLocaleDateString()}`}
            </p>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                trip.status === "active"
                  ? "bg-green-50 text-green-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {trip.status}
            </span>
          </div>
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
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
