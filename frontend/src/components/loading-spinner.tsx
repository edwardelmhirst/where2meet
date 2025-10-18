import React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizeClasses[size],
          className
        )}
      />
    </div>
  )
}

export function LoadingOverlay({ message = "Finding the perfect meeting point..." }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-8 rounded-lg shadow-lg text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-primary/40 border-b-transparent animate-spin animation-delay-150" />
            <div className="absolute inset-4 rounded-full border-4 border-primary/60 border-t-transparent animate-spin animation-delay-300" />
          </div>
        </div>
        <p className="text-lg font-medium text-foreground">{message}</p>
        <div className="flex justify-center space-x-2">
          <span className="animate-bounce animation-delay-0 text-primary text-2xl">•</span>
          <span className="animate-bounce animation-delay-150 text-primary text-2xl">•</span>
          <span className="animate-bounce animation-delay-300 text-primary text-2xl">•</span>
        </div>
      </div>
    </div>
  )
}