"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BudgetProgressBarProps {
  value: number; // 0-100 percentage value
  height?: string; // Custom height (default: h-3)
  gradientFrom?: string; // Starting gradient color
  gradientTo?: string; // Ending gradient color
  color?: string; // Solid color (used if gradients aren't provided)
  rounded?: boolean; // Whether to apply rounded corners (default: true)
  className?: string; // Additional classes
  animate?: boolean; // Whether to animate the progress (default: true)
  showValue?: boolean; // Whether to show percentage on the bar (default: false)
  label?: string; // Optional label text
  valuePrefix?: string; // Text to show before value (like '$')
  valueSuffix?: string; // Text to show after value (like '%')
}

export function BudgetProgressBar({
  value,
  height = "h-3",
  gradientFrom,
  gradientTo,
  color,
  rounded = true,
  className,
  animate = true,
  showValue = false,
  label,
  valuePrefix,
  valueSuffix = "%",
}: BudgetProgressBarProps) {
  // Ensure value is within 0-100 range
  const progressValue = Math.min(Math.max(0, value), 100);
  
  // Determine if we're using a gradient or solid color
  const useGradient = gradientFrom && gradientTo;
  
  // Generate background style
  const progressStyle: React.CSSProperties = {
    width: `${progressValue}%`,
    transition: animate ? 'width 0.5s ease-in-out' : 'none',
  };
  
  // Apply gradient or solid color
  if (useGradient) {
    progressStyle.backgroundImage = `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`;
  } else if (color) {
    progressStyle.backgroundColor = color;
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1 flex justify-between items-center text-sm">
          <span className="font-medium">{label}</span>
          {showValue && (
            <span>
              {valuePrefix}{progressValue.toFixed(1)}{valueSuffix}
            </span>
          )}
        </div>
      )}
      <div 
        className={cn(
          "w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden",
          height,
          rounded ? "rounded-full" : ""
        )}
      >
        <div
          className={cn(
            "h-full",
            !useGradient && !color ? "bg-blue-300" : "",
            rounded ? "rounded-full" : "",
          )}
          style={progressStyle}
        >
          {showValue && !label && (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
              {valuePrefix}{progressValue.toFixed(1)}{valueSuffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 