import type { Shift, ScheduleData } from "./types"
import { calculateVacationDaysWithHolidays } from "./vacation-utils"
import {
  generateSchedule,
  generate5DaySchedule,
  generate5DaySchedule15,
  getValidTeam,
  DEFAULT_TEAM_2X2,
} from "./schedule-utils"

export type VacationItem = { startDate: Date; days: number; isVisible?: boolean }

export type ReapplyVacationsParams = {
  scheduleType: "2x2" | "5days"
  schedule5DayType: "8hours" | "8-15"
  selectedTeam: string | null
  startDate: Date
}

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** Даты всех видимых отпусков. */
export function getVacationDateStrings(vacations: VacationItem[]): Set<string> {
  const set = new Set<string>()
  vacations.forEach((vacation) => {
    if (vacation.isVisible !== false) {
      calculateVacationDaysWithHolidays(vacation.startDate, vacation.days).forEach((date) => {
        set.add(formatDateStr(date))
      })
    }
  })
  return set
}

function buildBaselineSchedule(params: ReapplyVacationsParams): Map<string, Shift> {
  const { scheduleType, schedule5DayType, selectedTeam, startDate } = params
  if (scheduleType === "5days") {
    return schedule5DayType === "8-15"
      ? generate5DaySchedule15(startDate, 7200)
      : generate5DaySchedule(startDate, 7200)
  }
  const team = getValidTeam(selectedTeam ?? DEFAULT_TEAM_2X2)
  return generateSchedule(startDate, 7200, team as "Бригада 1")
}

/** Восстанавливает смены по графику для указанных дат (сохраняет заметки/уведомления). */
export function restoreBaselineShiftsForDates(
  shifts: Map<string, Shift>,
  dateStrings: Set<string>,
  params: ReapplyVacationsParams
): void {
  if (dateStrings.size === 0) return
  const baseline = buildBaselineSchedule(params)
  dateStrings.forEach((dateStr) => {
    const baselineShift = baseline.get(dateStr)
    if (!baselineShift) return
    const existing = shifts.get(dateStr)
    shifts.set(dateStr, {
      ...baselineShift,
      notes: existing?.notes,
      notifications: existing?.notifications,
    })
  })
}

/** Снимает эффект видимых отпусков с карты смен. */
export function stripVisibleVacationsFromShifts(
  shifts: Map<string, Shift>,
  vacations: VacationItem[]
): void {
  const vacationDates = getVacationDateStrings(vacations)
  vacationDates.forEach((dateStr) => {
    const shift = shifts.get(dateStr)
    if (shift?.type === "off") {
      shifts.delete(dateStr)
    } else if (shift) {
      const { isOnVacation: _, ...rest } = shift
      shifts.set(dateStr, rest)
    }
  })
}

export type ApplyVacationsOptions = {
  showWorkShiftsDuringVacation?: boolean
}

/**
 * Применяет видимые отпуска к карте смен.
 * showWorkShiftsDuringVacation: сохранить рабочий тип и пометить isOnVacation.
 */
export function applyVisibleVacationsToSchedule(
  shifts: Map<string, Shift>,
  vacations: VacationItem[],
  options?: ApplyVacationsOptions
): void {
  const showWork = options?.showWorkShiftsDuringVacation === true
  vacations.forEach((vacation) => {
    if (vacation.isVisible === false) return
    const vacationDates = calculateVacationDaysWithHolidays(
      vacation.startDate,
      vacation.days
    )
    vacationDates.forEach((date) => {
      const dateStr = formatDateStr(date)
      if (showWork) {
        const existing = shifts.get(dateStr)
        if (existing) {
          shifts.set(dateStr, { ...existing, isOnVacation: true })
        } else {
          shifts.set(dateStr, {
            date: dateStr,
            type: "off",
            hours: 0,
            minutes: 0,
            isOnVacation: true,
          })
        }
      } else {
        shifts.set(dateStr, {
          date: dateStr,
          type: "off",
          hours: 0,
          minutes: 0,
          isOnVacation: true,
        })
      }
    })
  })
}

/** Полная переустановка отпусков на текущей карте смен. */
export function reapplyAllVacations(
  shifts: Map<string, Shift>,
  scheduleData: ScheduleData,
  params: ReapplyVacationsParams
): void {
  const vacations = scheduleData.vacations ?? []
  const showWork = scheduleData.showWorkShiftsDuringVacation === true
  const vacationDates = getVacationDateStrings(vacations)

  stripVisibleVacationsFromShifts(shifts, vacations)

  if (showWork) {
    restoreBaselineShiftsForDates(shifts, vacationDates, params)
  }

  applyVisibleVacationsToSchedule(shifts, vacations, {
    showWorkShiftsDuringVacation: showWork,
  })
}

/**
 * Переносит заметки и уведомления из предыдущего расписания в новую карту смен
 * и применяет видимые отпуска. Мутирует newShifts.
 */
export function applyPreservedNotesAndVacations(
  newShifts: Map<string, Shift>,
  previousSchedule: ScheduleData
): void {
  previousSchedule.shifts.forEach((shift, date) => {
    if (shift.notes || (shift.notifications && shift.notifications.length > 0)) {
      const newShift = newShifts.get(date)
      if (newShift) {
        newShifts.set(date, {
          ...newShift,
          notes: shift.notes,
          notifications: shift.notifications,
        })
      }
    }
  })
  applyVisibleVacationsToSchedule(newShifts, previousSchedule.vacations ?? [], {
    showWorkShiftsDuringVacation: previousSchedule.showWorkShiftsDuringVacation,
  })
}
