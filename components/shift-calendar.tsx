"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Edit2, Bell, FileText } from "lucide-react"
import type { Shift, MonthlySettings, GlobalSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getWorkDaysInMonth, generateSchedule } from "@/lib/schedule-utils"

interface ShiftCalendarProps {
  shifts: Map<string, Shift>
  monthlySettings: Map<string, MonthlySettings>
  globalSettings: GlobalSettings
  onDateClick: (date: string) => void
  onEditMonth: (month: string) => void
  selectedDate: string | null
  onDateSelect: (date: string | null) => void
  onGenerateSchedule: (shifts: Map<string, Shift>, startDate: Date) => void
  selectedTeam: string | null
  onCurrentMonthChange?: (month: string) => void
}

export function ShiftCalendar({
  shifts,
  monthlySettings,
  globalSettings,
  onDateClick,
  onEditMonth,
  selectedDate,
  onDateSelect,
  onGenerateSchedule,
  selectedTeam,
  onCurrentMonthChange,
}: ShiftCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)

  const generatedMonthsRef = useRef<Set<string>>(new Set())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`
  const monthSettings = monthlySettings.get(monthKey)

  const workDays = getWorkDaysInMonth(year, month)
  const targetHours = monthSettings?.targetHours || workDays * 8

  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1

  const days: (number | null)[] = []
  for (let i = 0; i < adjustedStartingDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  useEffect(() => {
    if (!selectedTeam) return

    let needsExtension = false
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      if (!shifts.has(dateStr)) {
        needsExtension = true
        break
      }
    }

    if (!needsExtension) {
      return
    }

    const startDate = new Date(year, month, 1)
    const newShifts = generateSchedule(
      startDate,
      180,
      selectedTeam as any
    )

    onGenerateSchedule(newShifts, startDate)

  }, [year, month, monthKey, daysInMonth, shifts, selectedTeam, onGenerateSchedule, currentDate])

  const previousMonth = () => {
    const newMonth = currentDate.getMonth() - 1;
    const newYear = currentDate.getFullYear();
    if (newMonth < 0) {
      setCurrentDate(new Date(newYear - 1, 11, 1));
    } else {
      setCurrentDate(new Date(newYear, newMonth, 1));
    }
    onDateSelect(null);
  }

  const nextMonth = () => {
    const newMonth = currentDate.getMonth() + 1;
    const newYear = currentDate.getFullYear();
    if (newMonth > 11) {
      setCurrentDate(new Date(newYear + 1, 0, 1));
    } else {
      setCurrentDate(new Date(newYear, newMonth, 1));
    }
    onDateSelect(null);
  }

  useEffect(() => {
    if (onCurrentMonthChange) {
      onCurrentMonthChange(monthKey)
    }
  }, [monthKey, onCurrentMonthChange])

  const getShiftStyle = (day: number | null) => {
    if (!day) return {}
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const shift = shifts.get(dateStr)
    if (!shift) return {}

    if (shift.type === "day") {
      return { "--day-color": globalSettings.dayShiftColor } as React.CSSProperties
    }
    if (shift.type === "night" || shift.type === "offn" || shift.type === "night2" ) {
      return { "--night-color": globalSettings.nightShiftColor } as React.CSSProperties
    }
    return {}
  }

  const getShiftInfo = (day: number | null) => {
    if (!day) return null
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return shifts.get(dateStr) || null
  }

  const handleDateClick = (dateStr: string) => {
    if (clickTimeout) {
      clearTimeout(clickTimeout)
      setClickTimeout(null)
      onDateClick(dateStr)
    } else {
      onDateSelect(dateStr)
      const timeout = setTimeout(() => setClickTimeout(null), 300)
      setClickTimeout(timeout)
    }
  }

  const hasNotifications = (shift: Shift | null) =>
    !!shift?.notifications && shift.notifications.length > 0

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ]

  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Button variant="outline" size="icon" onClick={previousMonth} className="sm:hidden">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center flex-1">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={previousMonth} className="hidden sm:flex">
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Дневники: {targetHours} часов
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditMonth(monthKey)}
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Button variant="outline" size="icon" onClick={nextMonth} className="hidden sm:flex">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Часы сгенерированы автоматически без учета праздников
          </p>
        </div>

        <Button variant="outline" size="icon" onClick={nextMonth} className="sm:hidden">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs sm:text-sm font-semibold py-1 sm:py-2">
            {d}
          </div>
        ))}

        {days.map((day, idx) => {
          const shift = getShiftInfo(day)
          const dateStr = day
            ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : null

          return (
            <div
              key={idx}
              onClick={() => day && dateStr && handleDateClick(dateStr)}
              className={cn(
                "h-16 sm:h-20 min-w-[25px] sm:min-w-[30px] rounded-lg p-1 sm:p-2 cursor-pointer border flex flex-col items-center justify-center relative",
                day ? "hover:shadow-md" : "bg-muted/20",
                shift?.type === "day" && "bg-[var(--day-color)] text-white",
                (shift?.type === "night" || shift?.type === "offn" || shift?.type === "night2") && "bg-[var(--night-color)] text-white"
              )}
              style={getShiftStyle(day)}
            >
              {day && <span className="text-xs sm:text-sm font-semibold">{day}</span>}
              {shift && (shift.hours > 0 || shift.minutes > 0) && (
                <span className="text-xs text-center w-full">
                  {shift.hours > 0 && `${shift.hours}h`}
                  {shift.minutes > 0 && ` ${shift.minutes}m`}
                </span>
              )}
              {hasNotifications(shift) && (
                <Bell className="absolute top-1 right-1 h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              )}
              {shift?.notes && !hasNotifications(shift) && (
                <FileText className="absolute top-1 right-1 h-3 w-3 sm:h-4 sm:w-4 text-accent" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
