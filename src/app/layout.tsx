import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Footer from "@/components/layout/Footer";
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
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-[#F5F7FA] min-h-screen text-gray-900 antialiased">
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
