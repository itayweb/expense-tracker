"use client";

import { getDonutStrokeColor } from "@/lib/utils";

interface DonutChartProps {
  current: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export default function DonutChart({
  current,
  max,
  size = 72,
  strokeWidth = 7,
  showLabel = true,
  className = "",
}: DonutChartProps) {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const clampedPercentage = Math.min(percentage, 100);
  const isOver = percentage > 100;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clampedPercentage / 100);
  const strokeColor = getDonutStrokeColor(percentage);

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className={`w-full h-full ${isOver ? "animate-pulse" : ""}`}>
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="donut-progress"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-slate-200">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
