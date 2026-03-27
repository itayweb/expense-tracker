"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = "", id, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E] focus:bg-white ${className}`}
        {...props}
      />
    </div>
  );
}
