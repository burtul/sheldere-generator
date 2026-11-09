"use client"

import { useShiftTimer } from "@/hooks/use-shift-timer"
import type { Shift } from "@/lib/types"

interface ShiftTimerProps {
  currentShift: Shift | null
  isEnabled: boolean
}

export function ShiftTimer({ currentShift, isEnabled }: ShiftTimerProps) {
  const timeRemaining = useShiftTimer(currentShift, isEnabled)

  if (!isEnabled) return null

  return (
    <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border/50 shadow-sm">
      <span className="text-sm font-mono font-medium text-foreground">
        {timeRemaining}
      </span>
    </div>
  )
}
