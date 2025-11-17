import type { Shift, ShiftType } from "./types"

export const SHIFT_PATTERN = ["day", "day", "off", "off", "night", "night", "offn", "off"] as const

export function generateSchedule(startDate: Date, years = 3, startIndex = 0): Map<string, Shift> {
  const shifts = new Map<string, Shift>()
  const endDate = new Date(startDate)
  endDate.setFullYear(endDate.getFullYear() + years)

  let patternIndex = startIndex % SHIFT_PATTERN.length
  const currentDate = new Date(startDate)

  while (currentDate < endDate) {
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`
    const shiftType = SHIFT_PATTERN[patternIndex] as ShiftType

    let hours = 0
    if (shiftType === "day") {
      hours = 12
    } else if (shiftType === "night") {
      // Night shift hours depend on position in pattern
      hours = patternIndex === 4 ? 4 : 12
    } else if (shiftType === "offn") {
      hours = 8
    }

    shifts.set(dateKey, {
      date: dateKey,
      type: shiftType,
      hours,
      notes: "",
    })

    patternIndex = (patternIndex + 1) % SHIFT_PATTERN.length
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return shifts
}

// Обновленные функции для учета минут
export function getMonthHours(shifts: Map<string, Shift>, year: number, month: number): number {
  let totalMinutes = 0;

  shifts.forEach((shift, dateKey) => {
    const [shiftYear, shiftMonth] = dateKey.split("-").map(Number);
    if (shiftYear === year && shiftMonth === month) {
      totalMinutes += shift.hours * 60 + shift.minutes;
    }
  });

  return totalMinutes / 60; // Возвращаем десятичное значение часов
}

export function getMonthHoursFrom1To15(shifts: Map<string, Shift>, year: number, month: number): number {
  let totalMinutes = 0;

  shifts.forEach((shift, dateKey) => {
    const [shiftYear, shiftMonth, shiftDay] = dateKey.split("-").map(Number);
    if (shiftYear === year && shiftMonth === month && shiftDay <= 15) {
      totalMinutes += shift.hours * 60 + shift.minutes;
    }
  });

  return totalMinutes / 60; // Возвращаем десятичное значение часов
}

export function getWorkDaysInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let workDays = 0

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day)
    const dayOfWeek = d.getDay()
    if (dayOfWeek > 0 && dayOfWeek < 6) workDays++
  }

  return workDays
}
