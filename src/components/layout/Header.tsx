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
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Expense Tracker</h1>
            {budgetMonth && budgetYear && (
              <p className="text-sm text-gray-500">
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
            className={`text-sm pb-1 border-b-2 ${
              currentTab === "dashboard"
                ? "text-blue-600 font-medium border-blue-600"
                : "text-gray-500 hover:text-gray-700 border-transparent"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/history"
            className={`text-sm pb-1 border-b-2 ${
              currentTab === "history"
                ? "text-blue-600 font-medium border-blue-600"
                : "text-gray-500 hover:text-gray-700 border-transparent"
            }`}
          >
            History
          </Link>
        </div>
      </div>
    </header>
  );
}
