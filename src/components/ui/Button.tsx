"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  primary:
    "bg-[#22C55E] text-white hover:bg-[#16A34A] shadow-sm shadow-green-200",
  secondary:
    "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200",
  danger:
    "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
