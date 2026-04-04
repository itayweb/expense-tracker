"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import WizardContainer from "@/components/wizard/WizardContainer";
import { BudgetWithCategories } from "@/lib/types";

function getPreviousMonth(month: number, year: number) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

export default function WizardContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "edit" ? "edit" : "create";
  const [existingBudget, setExistingBudget] = useState<BudgetWithCategories | null>(null);
  const [previousBudget, setPreviousBudget] = useState<BudgetWithCategories | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const fetchBudget = (month: number, year: number) =>
      fetch(`/api/budget?month=${month}&year=${year}`)
        .then((res) => res.json())
        .then((data: BudgetWithCategories | null) => (data && !("error" in data) ? data : null))
        .catch(() => null);

    if (mode === "edit") {
      fetchBudget(currentMonth, currentYear)
        .then(setExistingBudget)
        .finally(() => setLoading(false));
    } else {
      const prev = getPreviousMonth(currentMonth, currentYear);
      fetchBudget(prev.month, prev.year)
        .then(setPreviousBudget)
        .finally(() => setLoading(false));
    }
  }, [mode]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F7FA]">
        <div className="animate-spin h-8 w-8 border-4 border-[#22C55E] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <WizardContainer
      mode={mode}
      existingBudget={existingBudget}
      previousBudget={previousBudget}
    />
  );
}
