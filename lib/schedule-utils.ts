import type { Shift, ShiftType } from "./types"

export const SHIFT_PATTERN = ["day", "day", "off", "off", "night", "night2", "offn", "off"] as const

const TEAM_PATTERNS = {
  "Бригада 1": ["off", "off", "night", "night2", "offn", "off", "day", "day"],
  "Бригада 2": ["night", "night2", "offn", "off", "day", "day", "off", "off"],
  "Бригада 3": ["offn", "off", "day", "day", "off", "off", "night", "night2"],
  "Бригада 4": ["day", "day", "off", "off", "night", "night2", "offn", "off"],
} as const

/* ------------------------------------------------------------------ */
/* БАЗОВАЯ ДАТА — ЯКОРЬ ПАТТЕРНА (ОЧЕНЬ ВАЖНО)                          */
/* ------------------------------------------------------------------ */
const PATTERN_BASE_DATE = new Date(2025, 0, 1) // 1 января 2025

function getPatternIndex(
  baseDate: Date,
  targetDate: Date,
  patternLength: number
) {
  const diffDays = Math.floor(
    (targetDate.getTime() - baseDate.getTime()) / 86400000
  )
  return ((diffDays % patternLength) + patternLength) % patternLength
}

/* ------------------------------------------------------------------ */
/* ГЕНЕРАЦИЯ СМЕН                                                     */
/* ------------------------------------------------------------------ */
export function generateSchedule(
  startDate: Date,
  daysAhead = 365,
  team: keyof typeof TEAM_PATTERNS = "Бригада 1"
): Map<string, Shift> {
  const shifts = new Map<string, Shift>()
  const pattern = TEAM_PATTERNS[team]

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + daysAhead)

  let patternIndex = getPatternIndex(
    PATTERN_BASE_DATE,
    startDate,
    pattern.length
  )

  const currentDate = new Date(startDate)

  while (currentDate < endDate) {
    const dateKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`

    const shiftType = pattern[patternIndex] as ShiftType

    let hours = 0
    let minutes = 0

    switch (shiftType) {
      case "day":
        hours = 12
        break
      case "night":
        hours = 4
        break
      case "night2":
        hours = 12 
        break
      case "offn":
        hours = 8
        break
    }

    shifts.set(dateKey, {
      date: dateKey,
      type: shiftType,
      hours,
      minutes,
      notes: "",
    })

    patternIndex = (patternIndex + 1) % pattern.length
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return shifts
}

/* ------------------------------------------------------------------ */
/* ПОДСЧЁТ ЧАСОВ                                                      */
/* ------------------------------------------------------------------ */
export function getMonthHours(
  shifts: Map<string, Shift>,
  year: number,
  month: number // 0–11
): number {
  let totalMinutes = 0

  shifts.forEach((shift, dateKey) => {
    const [y, m] = dateKey.split("-").map(Number)
    if (y === year && m === month + 1) {
      totalMinutes += shift.hours * 60 + shift.minutes
    }
  })

  return totalMinutes / 60
}

export function getMonthHoursFrom1To15(
  shifts: Map<string, Shift>,
  year: number,
  month: number // 0–11
): number {
  let totalMinutes = 0

  shifts.forEach((shift, dateKey) => {
    const [y, m, d] = dateKey.split("-").map(Number)
    if (y === year && m === month + 1 && d <= 15) {
      totalMinutes += shift.hours * 60 + shift.minutes
    }
  })

  return totalMinutes / 60
}

/* ------------------------------------------------------------------ */
/* РАБОЧИЕ ДНИ                                                        */
/* ------------------------------------------------------------------ */
export function getWorkDaysInMonth(year: number, month: number): number {
  const lastDay = new Date(year, month + 1, 0)
  let workDays = 0

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day)
    const dow = d.getDay()
    if (dow >= 1 && dow <= 5) workDays++
  }

  return workDays
}
