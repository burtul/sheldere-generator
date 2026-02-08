import { calculateVacationDays, calculateVacationDaysWithHolidays } from "@/lib/vacation-utils"

describe("Vacation Utils", () => {
  it("should calculate vacation days without holidays", () => {
    const startDate = new Date("2025-01-01")
    const vacationDays = 5
    const result = calculateVacationDays(startDate, vacationDays)
    expect(result.length).toBe(vacationDays)
  })

  it("should calculate vacation days with holidays", () => {
    const startDate = new Date("2025-01-01")
    const vacationDays = 5
    const result = calculateVacationDaysWithHolidays(startDate, vacationDays)
    expect(result.length).toBeGreaterThanOrEqual(vacationDays)
  })

  it("should handle weekends correctly", () => {
    const startDate = new Date("2025-01-02") // Saturday
    const vacationDays = 3
    const result = calculateVacationDays(startDate, vacationDays)
    expect(result.length).toBe(vacationDays)
  })

  it("should extend vacation for holidays", () => {
    const startDate = new Date("2025-01-01") // New Year
    const vacationDays = 5
    const result = calculateVacationDaysWithHolidays(startDate, vacationDays)
    expect(result.length).toBeGreaterThan(vacationDays)
  })
})