import type { Shift, ShiftType } from "./types"
import { generateHolidaysForYear } from "./holidays"
import { isValidDate } from "./utils"

// Функция для проверки, является ли день праздничным
export function isHoliday(date: Date): boolean {
  const year = date.getFullYear()
  const holidays = generateHolidaysForYear(year)
  const dateStr = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  return holidays.some(holiday => holiday.date === dateStr && !holiday.isWorkHoliday)
}

// Проверка, является ли день рабочим днём перед праздничным днём
export function isWorkDayBeforeHoliday(date: Date): boolean {
  const nextDay = new Date(date)
  nextDay.setDate(date.getDate() + 1)
  return isHoliday(nextDay) && date.getDay() >= 1 && date.getDay() <= 5
}

export const SHIFT_PATTERN = ["day", "day", "off", "off", "night", "night2", "offn", "off"] as const

/** Бригады для графика 2x2 (для валидации выбора). */
export const VALID_TEAMS_2X2 = ["Бригада 1", "Бригада 2", "Бригада 3", "Бригада 4"] as const

export const DEFAULT_TEAM_2X2 = "Бригада 4"

/** Возвращает переданную бригаду, если она из VALID_TEAMS_2X2, иначе DEFAULT_TEAM_2X2. */
export function getValidTeam(team: string): string {
  return VALID_TEAMS_2X2.includes(team as (typeof VALID_TEAMS_2X2)[number])
    ? team
    : DEFAULT_TEAM_2X2
}

const TEAM_PATTERNS = {
  "Бригада 1": ["off", "off", "night", "night2", "offn", "off", "day", "day"],
  "Бригада 2": ["night", "night2", "offn", "off", "day", "day", "off", "off"],
  "Бригада 3": ["offn", "off", "day", "day", "off", "off", "night", "night2"],
  "Бригада 4": ["day", "day", "off", "off", "night", "night2", "offn", "off"],
  "5 рабочих дней": ["weekday", "weekday", "weekday", "weekday", "weekday", "off", "off"],
  "5 рабочих дней 8-15": ["weekday15", "weekday15", "weekday15", "weekday15", "weekday7", "off", "off"],
} as const

/* ------------------------------------------------------------------ */
/* БАЗОВАЯ ДАТА — ЯКОРЬ ПАТТЕРНА (ОЧЕНЬ ВАЖНО)                          */
/* ------------------------------------------------------------------ */
// Базовая дата загружается из настроек, если не задана — используется дата по умолчанию
export const DEFAULT_PATTERN_BASE_DATE = new Date(2025, 0, 1) // 1 января 2025

function getPatternIndex(
  baseDate: Date,
  targetDate: Date,
  patternLength: number
) {
  if (patternLength <= 0) {
    throw new Error("Pattern length must be positive")
  }
  
  // Проверяем валидность входных дат
  if (!isValidDate(baseDate) || !isValidDate(targetDate)) {
    console.error('Invalid date provided to getPatternIndex');
    return 0; // Возвращаем безопасное значение по умолчанию
  }

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
  team: keyof typeof TEAM_PATTERNS | "5 рабочих дней" | "5 рабочих дней 8-15" ,
  baseDate?: Date
): Map<string, Shift> {
  const shifts = new Map<string, Shift>()

  // Обработка специальных случаев для 5-дневных графиков
  if (team === "5 рабочих дней") {
    return generate5DaySchedule(startDate, daysAhead)
  } else if (team === "5 рабочих дней 8-15") {
    return generate5DaySchedule15(startDate, daysAhead)
  }

  const pattern = TEAM_PATTERNS[team as keyof typeof TEAM_PATTERNS]

  // Проверка на существование паттерна
  if (!pattern) {
    console.error(`Team "${team}" not found in TEAM_PATTERNS. Using default team "Бригада 1".`)
    const defaultTeam = "Бригада 1"
    const defaultPattern = TEAM_PATTERNS[defaultTeam]
    if (!defaultPattern) {
      throw new Error("Default team pattern not found.")
    }
    return generateSchedule(startDate, daysAhead, defaultTeam, baseDate)
  }

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + daysAhead)

  // Используем переданную базовую дату или дефолтную с защитой от undefined
  const effectiveBaseDate = baseDate ? (
    isValidDate(baseDate) ? baseDate : DEFAULT_PATTERN_BASE_DATE
  ) : DEFAULT_PATTERN_BASE_DATE

  let patternIndex = getPatternIndex(
    effectiveBaseDate,
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
      case "weekday":
        hours = 8
        break
      case "weekday15":
        hours = 8
        minutes = 15
        break
      case "weekday7":
        hours = 7
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

/* ------------------------------------------------------------------ */
/* ГЕНЕРАЦИЯ СМЕН ДЛЯ 5 РАБОЧИХ ДНЕЙ (С ПОНЕДЕЛЬНИКА)                */
/* ------------------------------------------------------------------ */
export function generate5DaySchedule(
  startDate: Date,
  daysAhead = 365
): Map<string, Shift> {
  const shifts = new Map<string, Shift>()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + daysAhead)

  const currentDate = new Date(startDate)

  while (currentDate < endDate) {
    const dateKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`

    const dayOfWeek = currentDate.getDay()
    let shiftType: ShiftType = "off"
    let hours = 0

      // 0 - Воскресенье, 1 - Понедельник, ..., 6 - Суббота
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Проверяем, является ли день праздничным
        if (!isHoliday(currentDate)) {
          shiftType = "weekday"
          hours = 8
          // Уменьшаем рабочее время на 1 час, если это рабочий день перед праздничным днём
          if (isWorkDayBeforeHoliday(currentDate)) {
            hours -= 1
          }
        }
      }

    shifts.set(dateKey, {
      date: dateKey,
      type: shiftType,
      hours,
      minutes: 0,
      notes: "",
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return shifts
}

/* ------------------------------------------------------------------ */
/* ГЕНЕРАЦИЯ СМЕН ДЛЯ 5 РАБОЧИХ ДНЕЙ (8 ЧАСОВ 15 МИНУТ С ПН ПО ЧТ, 7 ЧАСОВ В ПТ) */
/* ------------------------------------------------------------------ */
export function generate5DaySchedule15(
  startDate: Date,
  daysAhead = 365
): Map<string, Shift> {
  const shifts = new Map<string, Shift>()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + daysAhead)

  const currentDate = new Date(startDate)

  while (currentDate < endDate) {
    const dateKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`

    const dayOfWeek = currentDate.getDay()
    let shiftType: ShiftType = "off"
    let hours = 0
    let minutes = 0

    // 0 - Воскресенье, 1 - Понедельник, ..., 6 - Суббота
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Проверяем, является ли день праздничным
      if (!isHoliday(currentDate)) {
        if (dayOfWeek >= 1 && dayOfWeek <= 4) {
          // Понедельник - Четверг: 8 часов 15 минут
          shiftType = "weekday15"
          hours = 8
          minutes = 15
          // Уменьшаем рабочее время на 1 час, если это рабочий день перед праздничным днём
          if (isWorkDayBeforeHoliday(currentDate)) {
            hours -= 1
          }
        } else if (dayOfWeek === 5) {
          // Пятница: 7 часов
          shiftType = "weekday7"
          hours = 7
          minutes = 0
          // Уменьшаем рабочее время на 1 час, если это рабочий день перед праздничным днём
          if (isWorkDayBeforeHoliday(currentDate)) {
            hours -= 1
          }
        }
      }
    }

    shifts.set(dateKey, {
      date: dateKey,
      type: shiftType,
      hours,
      minutes,
      notes: "",
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return shifts
}
