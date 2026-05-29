"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { ChevronLeft, ChevronRight, Edit2, Bell, FileText } from "lucide-react"
import type { Shift, MonthlySettings, GlobalSettings, Holiday } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn, isDateStringValid } from "@/lib/utils"
import { isWorkDayBeforeHoliday as isWorkDayBeforeHolidayUtils, isHoliday as isHolidayFromUtils } from "@/lib/schedule-utils"
import { getWorkDaysInMonth, generateSchedule, generate5DaySchedule, generate5DaySchedule15, DEFAULT_PATTERN_BASE_DATE } from "@/lib/schedule-utils"
import { exampleHolidays, generateHolidaysForYear } from "@/lib/holidays"

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
  scheduleType?: "2x2" | "5days"
  schedule5DayType?: "8hours" | "8-15"
  onVacationSave?: (vacationDates: Date[]) => void
  showWorkShiftsDuringVacation?: boolean
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
  scheduleType = "2x2",
  schedule5DayType = "8hours",
  onVacationSave,
  showWorkShiftsDuringVacation = false,
}: ShiftCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)

  const generatedMonthsRef = useRef<Set<string>>(new Set())
  const [vacationDates, setVacationDates] = useState<Date[]>([])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`
  const monthSettings = monthlySettings.get(monthKey)

  // Плановые часы для пятидневки считаются по рабочим дням месяца с учётом праздников.
  const calculateDefaultTargetHours = () => {
    const date = new Date(`${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00`);
    const lastDay = new Date(year, month + 1, 0);
    let targetHours = 0;

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (!isHolidayFromUtils(currentDate)) {
          targetHours += 8;
          if (isWorkDayBeforeHolidayUtils(currentDate)) {
            targetHours -= 1;
          }
        }
      }
    }

    return targetHours;
  };

  const workDays = getWorkDaysInMonth(year, month)
  const defaultTargetHours = calculateDefaultTargetHours()
  const targetHours = monthSettings?.targetHours || defaultTargetHours

  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1

  const days: (number | null)[] = []
  for (let i = 0; i < adjustedStartingDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  // Мемоизируем праздники для текущего года для производительности
  const holidaysForYear = useMemo(() => {
    // Всегда генерируем праздники для текущего года
    // Если в exampleHolidays уже есть праздники для этого года, используем их
    const existingHolidays = exampleHolidays.filter(h =>
      new Date(h.date).getFullYear() === year
    )

    if (existingHolidays.length > 0) {
      return existingHolidays
    }

    // Иначе генерируем новые праздники
    return generateHolidaysForYear(year)
  }, [year])

  // Обработчик изменения базовой даты (мемоизированный)
  const handleBaseDateChange = useCallback(() => {
    if (selectedTeam) {
      const startDate = new Date(year, month, 1)
      let newShifts: Map<string, Shift>

      if (scheduleType === "5days") {
        if (schedule5DayType === "8hours") {
          newShifts = generate5DaySchedule(startDate, 180)
        } else {
          newShifts = generate5DaySchedule15(startDate, 180)
        }
      } else {
        // Получаем актуальную базовую дату из localStorage с валидацией
        const storedBaseDate = typeof window !== 'undefined' ? localStorage.getItem('baseDate') : null;
        const baseDateValue = storedBaseDate && isDateStringValid(storedBaseDate) ?
          new Date(storedBaseDate) : DEFAULT_PATTERN_BASE_DATE;
        newShifts = generateSchedule(startDate, 180, selectedTeam as any, baseDateValue)
      }

      onGenerateSchedule(newShifts, startDate)
    }
  }, [year, month, selectedTeam, scheduleType, schedule5DayType, onGenerateSchedule]);

  // Подписка на событие изменения базовой даты
  useEffect(() => {
    window.addEventListener('baseDateChanged', handleBaseDateChange)
    return () => {
      window.removeEventListener('baseDateChanged', handleBaseDateChange)
    }
  }, [handleBaseDateChange])

  // Функция для проверки, является ли день сегодняшним
  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  // Функция для проверки праздников - работает с мемоизированными данными
  const isHoliday = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return holidaysForYear.some(holiday => holiday.date === dateStr)
  }

  // Функция для получения информации о празднике
  const getHolidayInfo = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return holidaysForYear.find(holiday => holiday.date === dateStr) || null
  }

  useEffect(() => {
    if (!selectedTeam) return

    // При переходе на месяц без сгенерированных смен расширяем расписание вперёд.
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
    let newShifts: Map<string, Shift>

    if (scheduleType === "5days") {
      if (schedule5DayType === "8hours") {
        newShifts = generate5DaySchedule(startDate, 180)
      } else {
        newShifts = generate5DaySchedule15(startDate, 180)
      }
    } else {
      newShifts = generateSchedule(
        startDate,
        180,
        selectedTeam as any
      )
    }

    onGenerateSchedule(newShifts, startDate)

  }, [year, month, monthKey, daysInMonth, shifts, selectedTeam, onGenerateSchedule, currentDate, scheduleType, schedule5DayType, globalSettings])

  useEffect(() => {
    if (vacationDates.length > 0 && onVacationSave) {
      const updatedShifts = new Map(shifts)
      vacationDates.forEach(date => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        updatedShifts.set(dateStr, {
          date: dateStr,
          type: "off",
          hours: 0,
          minutes: 0,
          notes: "Отпуск",
          isOnVacation: true,
        })
      })
      onGenerateSchedule(updatedShifts, new Date(year, month, 1))
      setVacationDates([])
    }
  }, [vacationDates, onVacationSave, shifts, year, month, onGenerateSchedule])

  const previousMonth = () => {
    const newMonth = currentDate.getMonth() - 1
    const newYear = currentDate.getFullYear()
    if (newMonth < 0) {
      setCurrentDate(new Date(newYear - 1, 11, 1))
    } else {
      setCurrentDate(new Date(newYear, newMonth, 1))
    }
    onDateSelect(null)
  }

  const nextMonth = () => {
    const newMonth = currentDate.getMonth() + 1
    const newYear = currentDate.getFullYear()
    if (newMonth > 11) {
      setCurrentDate(new Date(newYear + 1, 0, 1))
    } else {
      setCurrentDate(new Date(newYear, newMonth, 1))
    }
    onDateSelect(null)
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

    if (scheduleType === "5days") {
      if (shift.type === "weekday" || shift.type === "weekday15" || shift.type === "weekday7") {
        return { "--work-color": globalSettings.dayShiftColor } as React.CSSProperties
      }
      if (shift.type === "off") {
        return { "--off-color": globalSettings.offShiftColor } as React.CSSProperties
      }
    } else {
      if (shift.type === "day") {
        return { "--day-color": globalSettings.dayShiftColor } as React.CSSProperties
      }
      if (shift.type === "night" || shift.type === "offn" || shift.type === "night2") {
        return { "--night-color": globalSettings.nightShiftColor } as React.CSSProperties
      }
      if (shift.type === "off") {
        return { "--off-color": globalSettings.offShiftColor } as React.CSSProperties
      }
    }

    return {}
  }

  const getShiftInfo = (day: number | null) => {
    if (!day) return null
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return shifts.get(dateStr) || null
  }

  const handleDateClick = (dateStr: string) => {
    // Одинарный клик выбирает дату, двойной открывает редактор смены.
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

  const hasNotifications = (shift: Shift | null) => {
    return !!shift?.notifications && shift.notifications.length > 0;
  }

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ]

  // Очистка таймаута при размонтировании компонента
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout)
      }
    }
  }, [clickTimeout])

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
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Часы сгенерированы автоматически без учета праздников
          </p>
        </div>

        <Button variant="outline" size="icon" onClick={nextMonth} className="sm:hidden">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

       <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
         {weekDays.map(d => (
           <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
             {d}
           </div>
         ))}

         {days.map((day, idx) => {
           const shift = getShiftInfo(day)
           const dateStr = day
             ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
             : null

          const holiday = day ? isHoliday(day) : false
          const today = day ? isToday(day) : false
          const isOnVacation = shift?.isOnVacation === true
          const isWorkDuringVacation = isOnVacation && shift?.type !== "off"

          return (
            <div
              key={idx}
              onClick={() => day && dateStr && handleDateClick(dateStr)}
              className={cn(
                "h-16 sm:h-20 min-w-[40px] sm:min-w-[50px] rounded-lg p-1 sm:p-2 cursor-pointer border flex flex-col items-center justify-center relative",
                day ? "hover:border-primary/50 hover:shadow-sm bg-card" : "bg-muted/10",
                day ? "hover:ring-2 hover:ring-primary/30" : "bg-muted/10",
                day && !shift && "bg-muted/20 hover:bg-muted/30",
                today && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                scheduleType === "5days"
                  ? (shift?.type === "weekday" || shift?.type === "weekday15" || shift?.type === "weekday7") && "bg-[var(--work-color)] text-white shadow-sm"
                  : (shift?.type === "day") && "bg-[var(--day-color)] text-white shadow-sm",
                (shift?.type === "night" || shift?.type === "offn" || shift?.type === "night2") && "bg-[var(--night-color)] text-white shadow-sm",
                shift?.type === "off" && "bg-[var(--off-color)] text-white/90",
                isWorkDuringVacation && "ring-2 ring-amber-400 ring-offset-1 ring-offset-background"
              )}
              style={getShiftStyle(day)}
            >
              {day && (
                <span className={cn(
                  "text-xs sm:text-sm font-medium", 
                  shift && "drop-shadow-sm",
                  holiday && "text-red-500 font-bold" // Только красный цвет числа
                )}>
                  {day}
                </span>
              )}
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
              {isOnVacation && (
                <span
                  className={cn(
                    "absolute bottom-0.5 left-0.5 text-[9px] sm:text-[10px] font-bold px-1 rounded leading-none",
                    isWorkDuringVacation
                      ? "bg-amber-500/90 text-white"
                      : "bg-black/45 text-white"
                  )}
                  title="Отпуск"
                >
                  Отп
                </span>
              )}
            </div>
          )
        })}
      </div>

      {(showWorkShiftsDuringVacation || shifts.size > 0) &&
        Array.from(shifts.values()).some((s) => s.isOnVacation) && (
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-4 rounded border border-border"
              style={{ backgroundColor: globalSettings.offShiftColor }}
            />
            <span>Отпуск (выходной)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded bg-primary/80 ring-2 ring-amber-400" />
            <span>Смена в отпуске</span>
          </div>
        </div>
      )}
    </div>
  )
}
