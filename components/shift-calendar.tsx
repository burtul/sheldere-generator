"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Edit2 } from "lucide-react"
import type { Shift, MonthlySettings, GlobalSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ShiftCalendarProps {
  shifts: Map<string, Shift>
  monthlySettings: Map<string, MonthlySettings>
  globalSettings: GlobalSettings
  onDateClick: (date: string) => void
  onEditMonth: (month: string) => void
}

export function ShiftCalendar({
  shifts,
  monthlySettings,
  globalSettings,
  onDateClick,
  onEditMonth,
}: ShiftCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`
  const monthSettings = monthlySettings.get(monthKey)
  const targetHours = monthSettings?.targetHours || 0

  const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1

  const days = []
  for (let i = 0; i < adjustedStartingDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getShiftStyle = (day: number | null) => {
    if (!day) return {}

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const shift = shifts.get(dateStr)

    if (!shift) return {}

    // Используем инлайн-стили только для CSS переменных
    if (shift.type === "day") {
      return { "--day-color": globalSettings.dayShiftColor } as React.CSSProperties
    } else if (shift.type === "night") {
      return { "--night-color": globalSettings.nightShiftColor } as React.CSSProperties
    }
    return {}
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const getShiftInfo = (day: number | null) => {
    if (!day) return null
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return shifts.get(dateStr)
  }

  const handleDateClick = (dateStr: string) => {
    // Очищаем предыдущий таймаут, если он есть
    if (clickTimeout) {
      clearTimeout(clickTimeout)
      setClickTimeout(null)
      // Это двойной клик - открываем редактор
      onDateClick(dateStr)
    } else {
      // Это первый клик - устанавливаем таймаут
      setSelectedDate(dateStr)
      const timeout = setTimeout(() => {
        setClickTimeout(null)
      }, 300) // Время для определения двойного клика (300ms)
      setClickTimeout(timeout)
    }
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Левая стрелка */}
        <Button variant="outline" size="icon" onClick={previousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Название месяца и информация */}
        <div className="flex flex-col items-center flex-1">
          <h2 className="text-2xl font-bold text-foreground">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          
          {/* Строка с информацией о дневниках и кнопкой редактирования */}
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">Дневники: {targetHours} часы</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEditMonth(monthKey)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Правая стрелка */}
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {days.map((day, idx) => {
          const shift = getShiftInfo(day)
          const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null

          return (
            <div
              key={idx}
              onClick={() => {
                if (day && dateStr) {
                  handleDateClick(dateStr)
                }
              }}
              className={cn(
                "aspect-square rounded-lg p-2 cursor-pointer transition-all relative",
                "flex flex-col justify-center items-center border",
                day ? "hover:border-primary/50 hover:shadow-md bg-card" : "bg-muted/20",
                selectedDate === dateStr && "ring-2 ring-primary",
                shift?.notes ? "border-4 border-accent" : "border-border",
                // Динамические классы для смен
                shift?.type === "day" && "bg-[var(--day-color)]",
                shift?.type === "night" && "bg-[var(--night-color)]",
                (shift?.type === "day" || shift?.type === "night") && "text-white"
              )}
              style={getShiftStyle(day)}
            >
              {day && (
                <>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      shift?.type === "off" ? "text-muted-foreground" : 
                      (shift?.type === "day" || shift?.type === "night") ? "text-white" : "text-foreground"
                    )}
                  >
                    {day}
                  </span>
                  {shift && shift.type !== "off" && (
                    <span className={cn(
                      "text-xs font-medium",
                      (shift?.type === "day" || shift?.type === "night") ? "text-white/90" : "text-foreground/70"
                    )}>
                      {shift.hours}h
                    </span>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}