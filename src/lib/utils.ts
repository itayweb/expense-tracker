export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getProgressColor(percentage: number): string {
  if (percentage < 60) return "bg-[#22C55E]";
  if (percentage < 85) return "bg-amber-400";
  return "bg-red-400";
}

export function getProgressTextColor(percentage: number): string {
  if (percentage < 60) return "text-[#22C55E]";
  if (percentage < 85) return "text-amber-500";
  return "text-red-500";
}

export function getDonutStrokeColor(percentage: number): string {
  if (percentage < 60) return "#22C55E";
  if (percentage < 85) return "#F59E0B";
  return "#EF4444";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Returns a consistent color for a category based on its name
export function getCategoryColor(name: string): string {
  const colors = [
    "#F97316", // orange
    "#3B82F6", // blue
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#14B8A6", // teal
    "#EAB308", // yellow
    "#EF4444", // red
    "#22C55E", // green
    "#6366F1", // indigo
    "#F43F5E", // rose
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
