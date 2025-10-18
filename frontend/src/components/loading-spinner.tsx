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
          "animate-spin rounded-full gradient-primary",
          sizeClasses[size],
          className
        )}
        style={{
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
        }}
      />
    </div>
  )
}

export function LoadingOverlay({ message = "Finding the perfect meeting point..." }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white/95 backdrop-blur-lg p-10 rounded-2xl shadow-2xl text-center space-y-6 max-w-md mx-4">
        <div className="relative">
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 rounded-full gradient-primary opacity-20 animate-ping" />
            <div className="absolute inset-0 rounded-full gradient-primary opacity-40 animate-ping animation-delay-150" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-4 gradient-primary animate-spin" 
                 style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }} />
            <div className="absolute inset-2 rounded-full border-4 border-blue-300/60 animate-spin animation-delay-150"
                 style={{ borderBottomColor: 'transparent', borderLeftColor: 'transparent', animationDirection: 'reverse' }} />
            <div className="absolute inset-4 rounded-full gradient-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {message}
          </p>
          <div className="flex justify-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce animation-delay-150" />
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce animation-delay-300" />
          </div>
        </div>
      </div>
    </div>
  )
}