"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    color?: string;
    gradientFrom?: string;
    gradientTo?: string;
    indicator?: React.ReactNode;
  }
>(({ className, value, color, gradientFrom, gradientTo, indicator, ...props }, ref) => {
  // Determine the styling for the indicator
  const indicatorStyle: React.CSSProperties = {};
  
  // Set transform based on value
  indicatorStyle.transform = `translateX(-${100 - (value || 0)}%)`;
  
  // Apply gradient if both gradientFrom and gradientTo are provided
  if (gradientFrom && gradientTo) {
    indicatorStyle.backgroundImage = `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`;
  } 
  // Apply solid color if only color is provided
  else if (color) {
    indicatorStyle.backgroundColor = color;
  }
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", {
          "bg-primary": !color && !gradientFrom && !gradientTo,
        })}
        style={indicatorStyle}
      >
        {indicator}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress } 