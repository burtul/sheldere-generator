import { generateHolidaysForYear } from "./holidays"
import type { Holiday } from "./types"

// Проверяет дату по заранее переданному списку праздников.
function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  return holidays.some(h => h.date === dateStr)
}

/**
 * Возвращает все календарные даты отпуска.
 * Праздничные нерабочие дни попадают в результат, но не уменьшают лимит vacationDays.
 */
export function calculateVacationDaysWithHolidays(
  startDate: Date,
  vacationDays: number
): Date[] {
  const result: Date[] = []
  const currentDate = new Date(startDate)

  let countedVacationDays = 0
  let holidaysCache: Record<number, Holiday[]> = {}

  while (countedVacationDays < vacationDays) {
    const year = currentDate.getFullYear()

    // Праздники кэшируются по году, чтобы не пересчитывать их на каждом дне отпуска.
    if (!holidaysCache[year]) {
      holidaysCache[year] = generateHolidaysForYear(year)
    }

     const isHoliday = holidaysCache[year].some(h => {
       const holidayDate = new Date(h.date)
       return (
         holidayDate.getFullYear() === currentDate.getFullYear() &&
         holidayDate.getMonth() === currentDate.getMonth() &&
         holidayDate.getDate() === currentDate.getDate() &&
         !h.isWorkHoliday // Исключаем рабочие праздники
       )
     })

    // В календарь отпуска добавляются все дни промежутка, включая праздники.
    result.push(new Date(currentDate))

    // Дни отпуска расходуются только на непраздничные даты.
    if (!isHoliday) {
      countedVacationDays++
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}

