"use client";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthNavigatorProps {
  month: number;
  year: number;
  onNavigate: (month: number, year: number) => void;
}

export default function MonthNavigator({ month, year, onNavigate }: MonthNavigatorProps) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const isCurrentMonth = month === currentMonth && year === currentYear;

  const goPrev = () => {
    if (month === 1) {
      onNavigate(12, year - 1);
    } else {
      onNavigate(month - 1, year);
    }
  };

  const goNext = () => {
    if (isCurrentMonth) return;
    if (month === 12) {
      onNavigate(1, year + 1);
    } else {
      onNavigate(month + 1, year);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={goPrev}
        className="text-gray-400 hover:text-gray-700 px-2 py-1 text-lg transition-colors"
      >
        &larr;
      </button>
      <span className="text-base font-semibold text-gray-800 min-w-40 text-center">
        {monthNames[month - 1]} {year}
      </span>
      <button
        onClick={goNext}
        disabled={isCurrentMonth}
        className={`px-2 py-1 text-lg transition-colors ${
          isCurrentMonth
            ? "text-gray-200 cursor-not-allowed"
            : "text-gray-400 hover:text-gray-700"
        }`}
      >
        &rarr;
      </button>
    </div>
  );
}
