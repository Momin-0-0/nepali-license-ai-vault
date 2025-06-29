import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "dots" | "pulse"
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = "md", variant = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6", 
      lg: "w-8 h-8"
    }

    if (variant === "dots") {
      return (
        <div
          ref={ref}
          className={cn("flex space-x-1", className)}
          {...props}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "bg-current rounded-full animate-pulse",
                size === "sm" ? "w-1 h-1" : size === "md" ? "w-2 h-2" : "w-3 h-3"
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1s"
              }}
            />
          ))}
        </div>
      )
    }

    if (variant === "pulse") {
      return (
        <div
          ref={ref}
          className={cn(
            "bg-current rounded-full animate-pulse",
            sizeClasses[size],
            className
          )}
          {...props}
        />
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

export { LoadingSpinner }