"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import WizardContainer from "@/components/wizard/WizardContainer";
import { BudgetWithCategories } from "@/lib/types";

export default function WizardContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "edit" ? "edit" : "create";
  const [existingBudget, setExistingBudget] = useState<BudgetWithCategories | null>(null);
  const [loading, setLoading] = useState(mode === "edit");

  useEffect(() => {
    if (mode === "edit") {
      fetch("/api/budget")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setExistingBudget(data);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [mode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <WizardContainer mode={mode} existingBudget={existingBudget} />;
}
