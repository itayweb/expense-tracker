import type { Metadata } from "next";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { authClient } from "@/lib/auth/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses and manage your budget with AI-powered suggestions",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#F5F7FA] min-h-screen text-gray-900 antialiased">
        <NeonAuthUIProvider authClient={authClient}>
          {children}
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
