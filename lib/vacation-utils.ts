import { generateHolidaysForYear } from "./holidays"
import type { Holiday } from "./types"

// Проверка, является ли день праздничным
function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  return holidays.some(h => h.date === dateStr)
}

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

    if (!holidaysCache[year]) {
      holidaysCache[year] = generateHolidaysForYear(year)
    }

    const isHoliday = holidaysCache[year].some(h => {
      const holidayDate = new Date(h.date)
      return (
        holidayDate.getFullYear() === currentDate.getFullYear() &&
        holidayDate.getMonth() === currentDate.getMonth() &&
        holidayDate.getDate() === currentDate.getDate()
      )
    })

    // ⬇️ ВСЕ дни в промежутке отпуска — off
    result.push(new Date(currentDate))

    // ⬇️ СЧИТАЕМ ТОЛЬКО НЕПРАЗДНИЧНЫЕ
    if (!isHoliday) {
      countedVacationDays++
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}

