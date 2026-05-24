"use client"

import { useState, useEffect } from "react"
import type { ScheduleData, MonthlySettings } from "@/lib/types"
import { generateSchedule } from "@/lib/schedule-utils"
import { loadScheduleData, saveScheduleData } from "@/lib/storage"
import { defaultColors } from "@/lib/color-presets"
import { DEFAULT_TEAM_2X2 } from "@/lib/schedule-utils"

const DEFAULT_START_DATE = new Date(2025, 0, 1)
const DAYS_AHEAD = 7200

/**
 * Загружает расписание из localStorage или создаёт дефолтное.
 * Сохраняет при изменении; регистрирует service worker при монтировании.
 */
export function useScheduleData(): {
  scheduleData: ScheduleData | null
  setScheduleData: React.Dispatch<React.SetStateAction<ScheduleData | null>>
  loading: boolean
} {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = loadScheduleData()
    if (saved) {
      setScheduleData(saved)
    } else {
      const shifts = generateSchedule(DEFAULT_START_DATE, DAYS_AHEAD, DEFAULT_TEAM_2X2)
      const monthlySettings = new Map<string, MonthlySettings>()
      setScheduleData({
        startDate: DEFAULT_START_DATE,
        shifts,
        monthlySettings,
        globalSettings: {
          dayShiftColor: defaultColors.dayShift,
          nightShiftColor: defaultColors.nightShift,
          offShiftColor: "#6b7280",
        },
      })
    }
    setLoading(false)

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (scheduleData) {
      saveScheduleData(scheduleData)
    }
  }, [scheduleData])

  return { scheduleData, setScheduleData, loading }
}
