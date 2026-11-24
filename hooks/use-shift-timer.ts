"use client"

import { useEffect, useState } from "react"
import type { Shift } from "@/lib/types"
import { formatShiftRemaining, isWorkShift } from "@/lib/shift-timing"

/**
 * Хук для отображения времени до конца смены в формате hh:mm.
 * Расчёт вынесен в `lib/shift-timing.ts`, чтобы таймер, уведомление
 * и live-островок считали одинаково.
 *
 * @param currentShift - Текущая смена
 * @param isEnabled - Включен ли таймер
 */
export function useShiftTimer(
  currentShift: Shift | null,
  isEnabled: boolean = true
): string {
  const [timeRemaining, setTimeRemaining] = useState<string>("--:--")

  useEffect(() => {
    if (!isEnabled || !isWorkShift(currentShift)) {
      setTimeRemaining("--:--")
      return
    }

    const updateTimer = () => {
      setTimeRemaining(formatShiftRemaining(currentShift) ?? "--:--")
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [currentShift, isEnabled])

  return timeRemaining
}
