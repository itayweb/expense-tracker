"use client";

import { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import TripCard from "./TripCard";
import CreateTripModal from "./CreateTripModal";
import { TripItem } from "@/lib/types";

interface TripSectionProps {
  onRefresh: () => void;
}

export default function TripSection({ onRefresh }: TripSectionProps) {
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch("/api/trips");
      if (res.ok) {
        setTrips(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch trips:", error);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleRefresh = () => {
    fetchTrips();
    onRefresh();
  };

  const activeTrips = trips.filter((t) => t.status === "active");
  const completedTrips = trips.filter((t) => t.status === "completed");

  return (
    <div className="mt-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Trips</h2>
          <Button size="sm" onClick={() => setShowCreateModal(true)} data-testid="new-trip-btn">
            + New Trip
          </Button>
        </div>

        {trips.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No trips yet. Create one to track trip expenses.
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onRefresh={handleRefresh} />
            ))}

            {completedTrips.length > 0 && (
              <>
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="w-full text-left text-xs text-gray-400 hover:text-gray-600 py-2.5 transition-colors"
                >
                  {showCompleted ? "▲ Hide" : "▼ Show"} {completedTrips.length} completed trip{completedTrips.length !== 1 ? "s" : ""}
                </button>
                {showCompleted && completedTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onRefresh={handleRefresh} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <CreateTripModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleRefresh}
      />
    </div>
  );
}
