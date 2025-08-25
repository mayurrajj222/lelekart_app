import React from "react";
import { cn } from "@/lib/utils";

interface ViewFieldProps {
  value: string;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ViewField({
  value,
  placeholder = "Not provided",
  className,
  children,
}: ViewFieldProps) {
  const displayValue = value?.trim() || placeholder;
  const isEmpty = !value?.trim();

  return (
    <div
      className={cn(
        "min-h-[40px] px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50/50",
        "flex items-center justify-between group",
        isEmpty && "text-gray-500 italic",
        "hover:bg-gray-100/50 transition-colors duration-200",
        className
      )}
    >
      <span className="flex-1">{displayValue}</span>
      {children}
    </div>
  );
}
