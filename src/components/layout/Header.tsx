"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface HeaderProps {
  currentTab: "dashboard" | "history";
  budgetMonth?: number;
  budgetYear?: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function Header({ currentTab, budgetMonth, budgetYear }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-[#1A1A2E]/80 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Expense Tracker</h1>
            {budgetMonth && budgetYear && (
              <p className="text-sm text-slate-400">
                {monthNames[budgetMonth - 1]} {budgetYear}
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/wizard?mode=edit")}
          >
            Edit Budget
          </Button>
        </div>
        <div className="flex gap-4 mt-3">
          <Link
            href="/"
            className={`text-sm pb-1 border-b-2 transition-colors ${
              currentTab === "dashboard"
                ? "text-emerald-400 font-medium border-emerald-400"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/history"
            className={`text-sm pb-1 border-b-2 transition-colors ${
              currentTab === "history"
                ? "text-emerald-400 font-medium border-emerald-400"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            History
          </Link>
        </div>
      </div>
    </header>
  );
}
