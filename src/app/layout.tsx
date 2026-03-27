import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses and manage your budget with AI-powered suggestions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0F0F1A] min-h-screen text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
