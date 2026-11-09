"use client"

import { useState, useEffect, useMemo } from "react"
import type { Shift, ShiftType } from "@/lib/types"

/**
 * Стандартные времена начала смен по типу
 */
const DEFAULT_SHIFT_START_TIMES: Record<ShiftType, { hours: number; minutes: number }> = {
  day: { hours: 8, minutes: 0 },
  night: { hours: 20, minutes: 0 },
  night2: { hours: 20, minutes: 0 },
  off: { hours: 0, minutes: 0 },
  offn: { hours: 0, minutes: 0 },
  weekday: { hours: 8, minutes: 0 },
  weekday15: { hours: 8, minutes: 0 },
  weekday7: { hours: 8, minutes: 0 },
}

/**
 * Хук для отображения времени до конца смены в формате hh:mm
 * @param currentShift - Текущая смена
 * @param isEnabled - Включен ли таймер
 */
export function useShiftTimer(
  currentShift: Shift | null,
  isEnabled: boolean = true
): string {
  const [timeRemaining, setTimeRemaining] = useState<string>("--:--")

  const shiftStartTime = useMemo(() => {
    if (!currentShift) return null
    return DEFAULT_SHIFT_START_TIMES[currentShift.type]
  }, [currentShift])

  useEffect(() => {
    if (!isEnabled) {
      setTimeRemaining("--:--")
      return
    }

    if (!currentShift || !shiftStartTime) {
      setTimeRemaining("--:--")
      return
    }

    if (currentShift.type === "off" || currentShift.type === "offn") {
      setTimeRemaining("--:--")
      return
    }

    const shiftDurationMinutes = currentShift.hours * 60 + currentShift.minutes
    const endHours = (shiftStartTime.hours + Math.floor(shiftDurationMinutes / 60)) % 24
    const endMinutes = (shiftStartTime.minutes + (shiftDurationMinutes % 60)) % 60

    const updateTimer = () => {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      let shiftStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        shiftStartTime.hours,
        shiftStartTime.minutes
      )

      let shiftEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        endHours,
        endMinutes
      )

      // Ночная смена переходит через полночь
      if (endHours < shiftStartTime.hours && (currentShift.type === "night" || currentShift.type === "night2")) {
        shiftEnd = new Date(shiftEnd.getTime() + 24 * 60 * 60 * 1000)
      }

      // Если смена уже закончилась, берём следующую
      if (now >= shiftEnd) {
        shiftStart = new Date(shiftStart.getTime() + 24 * 60 * 60 * 1000)
        shiftEnd = new Date(shiftStart.getTime() + shiftDurationMinutes * 60 * 1000)
      }

      const diffMs = shiftEnd.getTime() - now.getTime()

      if (diffMs <= 0) {
        setTimeRemaining("00:00")
        return
      }

      const diffMinutes = Math.floor(diffMs / 60000)
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60

      setTimeRemaining(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [currentShift, shiftStartTime, isEnabled])

  return timeRemaining
}
