import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-[#1A1A2E] rounded-2xl shadow-lg shadow-black/20 border border-white/[0.08] p-6 ${className}`}>
      {children}
    </div>
  );
}
