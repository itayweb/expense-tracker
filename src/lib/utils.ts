export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getProgressColor(percentage: number): string {
  if (percentage < 60) return "bg-emerald-500";
  if (percentage < 85) return "bg-amber-400";
  return "bg-red-400";
}

export function getProgressTextColor(percentage: number): string {
  if (percentage < 60) return "text-emerald-400";
  if (percentage < 85) return "text-amber-400";
  return "text-red-400";
}

export function getDonutStrokeColor(percentage: number): string {
  if (percentage < 60) return "#4ADE80";
  if (percentage < 85) return "#FBBF24";
  return "#F87171";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
