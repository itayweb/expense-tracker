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

  if (trips.length === 0 && !showCreateModal) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Trips</h2>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            + New Trip
          </Button>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">
          No trips yet. Create one to start tracking trip expenses.
        </p>
        <CreateTripModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Trips</h2>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          + New Trip
        </Button>
      </div>

      {activeTrips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onRefresh={handleRefresh} />
          ))}
        </div>
      )}

      {completedTrips.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            {showCompleted ? "Hide" : "Show"} completed trips ({completedTrips.length})
          </button>
          {showCompleted && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
              {completedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} onRefresh={handleRefresh} />
              ))}
            </div>
          )}
        </div>
      )}

      <CreateTripModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleRefresh}
      />
    </div>
  );
}
