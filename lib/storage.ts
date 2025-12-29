import type { ScheduleData, Shift } from "./types"

const STORAGE_KEY = "shift_schedule_data"

export function saveScheduleData(data: ScheduleData): void {
  const serialized = {
    startDate: data.startDate.toISOString(),
    shifts: Array.from(data.shifts.entries()),
    monthlySettings: Array.from(data.monthlySettings.entries()),
    globalSettings: data.globalSettings,
    globalNotes: data.globalNotes,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
}

export function loadScheduleData(): ScheduleData | null {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return null

  try {
    const parsed = JSON.parse(data)

    // Восстанавливаем смены с проверкой на undefined и NaN
    const shifts = new Map<string, Shift>()
    parsed.shifts.forEach(([dateKey, shift]: [string, any]) => {
      // Проверяем и устанавливаем значения по умолчанию для hours и minutes
      const hours = (shift.hours !== undefined && !isNaN(shift.hours)) ? shift.hours : 0
      const minutes = (shift.minutes !== undefined && !isNaN(shift.minutes)) ? shift.minutes : 0

      shifts.set(dateKey, {
        ...shift,
        hours,
        minutes,
      })
    })

    return {
      startDate: new Date(parsed.startDate),
      shifts,
      monthlySettings: new Map(parsed.monthlySettings),
      globalSettings: parsed.globalSettings || { dayShiftColor: "#f59e0b", nightShiftColor: "#4f46e5" },
      globalNotes: parsed.globalNotes || "",
    }
  } catch {
    return null
  }
}
