"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface StepIncomeProps {
  income: number;
  onChange: (income: number) => void;
  onNext: () => void;
}

export default function StepIncome({ income, onChange, onNext }: StepIncomeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">What&apos;s your monthly income?</h2>
        <p className="text-slate-400 mt-1">
          Enter your total monthly take-home pay after taxes.
        </p>
      </div>

      <div className="max-w-xs">
        <Input
          id="income"
          label="Monthly Income (₪)"
          type="number"
          min={0}
          step={100}
          value={income || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="e.g. 5000"
        />
      </div>

      <Button onClick={onNext} disabled={income <= 0}>
        Next
      </Button>
    </div>
  );
}
