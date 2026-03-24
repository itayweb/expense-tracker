export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getProgressColor(percentage: number): string {
  if (percentage < 60) return "bg-green-500";
  if (percentage < 85) return "bg-yellow-500";
  return "bg-red-500";
}

export function getProgressTextColor(percentage: number): string {
  if (percentage < 60) return "text-green-600";
  if (percentage < 85) return "text-yellow-600";
  return "text-red-600";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
