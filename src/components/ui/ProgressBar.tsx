"use client";

import { getProgressColor } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
  height?: string;
}

export default function ProgressBar({
  current,
  max,
  showLabel = true,
  height = "h-4",
}: ProgressBarProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const clampedWidth = Math.min(percentage, 100);
  const colorClass = getProgressColor(percentage);
  const isOver = percentage > 100;

  return (
    <div>
      <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${colorClass} ${height} rounded-full transition-all duration-500 ${
            isOver ? "animate-pulse" : ""
          }`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-gray-500 mt-1">
          {Math.round(percentage)}% used
        </p>
      )}
    </div>
  );
}
