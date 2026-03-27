"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}

const sizeClasses = {
  md: "max-w-md",
  lg: "max-w-lg",
};

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#1A1A2E] rounded-2xl shadow-2xl shadow-black/40 border border-white/[0.08] p-6 w-full ${sizeClasses[size]} mx-4 max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
