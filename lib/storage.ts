import type { ScheduleData } from "./types"

const STORAGE_KEY = "shift_schedule_data"

export function saveScheduleData(data: ScheduleData): void {
  const serialized = {
    startDate: data.startDate.toISOString(),
    shifts: Array.from(data.shifts.entries()),
    monthlySettings: Array.from(data.monthlySettings.entries()),
    globalSettings: data.globalSettings, // save global settings
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
}

export function loadScheduleData(): ScheduleData | null {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return null

  try {
    const parsed = JSON.parse(data)
    return {
      startDate: new Date(parsed.startDate),
      shifts: new Map(parsed.shifts),
      monthlySettings: new Map(parsed.monthlySettings),
      globalSettings: parsed.globalSettings || { dayShiftColor: "#f59e0b", nightShiftColor: "#4f46e5" }, // load global settings with defaults
    }
  } catch {
    return null
  }
}
