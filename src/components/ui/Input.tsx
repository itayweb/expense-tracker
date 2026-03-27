"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = "", id, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-xl border border-white/[0.15] bg-[#242442] px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${className}`}
        {...props}
      />
    </div>
  );
}
