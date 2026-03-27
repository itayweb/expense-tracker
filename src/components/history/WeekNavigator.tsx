"use client";

interface WeekBoundary {
  weekNumber: number;
  start: string;
  end: string;
}

interface WeekNavigatorProps {
  weekNumber: number | null;
  weeks: WeekBoundary[];
  onNavigate: (weekNumber: number | null) => void;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function WeekNavigator({ weekNumber, weeks, onNavigate }: WeekNavigatorProps) {
  if (weeks.length === 0) return null;

  const currentWeek = weekNumber
    ? weeks.find((w) => w.weekNumber === weekNumber)
    : null;

  const goPrev = () => {
    if (weekNumber === null) {
      onNavigate(weeks[weeks.length - 1].weekNumber);
    } else if (weekNumber > 1) {
      onNavigate(weekNumber - 1);
    }
  };

  const goNext = () => {
    if (weekNumber !== null && weekNumber < weeks.length) {
      onNavigate(weekNumber + 1);
    } else if (weekNumber === weeks.length) {
      onNavigate(null);
    }
  };

  const canGoPrev = weekNumber === null || weekNumber > 1;
  const canGoNext = weekNumber !== null;

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={goPrev}
        disabled={!canGoPrev}
        className={`px-2 py-1 text-lg transition-colors ${
          canGoPrev ? "text-gray-400 hover:text-gray-700" : "text-gray-200 cursor-not-allowed"
        }`}
      >
        &larr;
      </button>
      <span className="text-sm font-medium text-gray-600 min-w-48 text-center">
        {weekNumber === null ? (
          "All Weeks"
        ) : currentWeek ? (
          <>
            Week {currentWeek.weekNumber} ({formatShortDate(currentWeek.start)} –{" "}
            {formatShortDate(currentWeek.end)})
          </>
        ) : (
          `Week ${weekNumber}`
        )}
      </span>
      <button
        onClick={goNext}
        disabled={!canGoNext}
        className={`px-2 py-1 text-lg transition-colors ${
          canGoNext ? "text-gray-400 hover:text-gray-700" : "text-gray-200 cursor-not-allowed"
        }`}
      >
        &rarr;
      </button>
    </div>
  );
}
