"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Edit2 } from "lucide-react"
import type { Shift, MonthlySettings, GlobalSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"

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

    if (shift.type === "day") {
      return { backgroundColor: globalSettings.dayShiftColor }
    } else if (shift.type === "night") {
      return { backgroundColor: globalSettings.nightShiftColor }
    }
    return {}
  }

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const getShiftInfo = (day: number | null) => {
    if (!day) return null
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return shifts.get(dateStr)
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Дневники: {targetHours} часы</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => onEditMonth(monthKey)}>
            <Edit2 className="h-4 w-4 mr-2" />
            настройки месяца
          </Button>
        </div>
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
                  setSelectedDate(dateStr)
                  onDateClick(dateStr)
                }
              }}
              className={`
                aspect-square rounded-lg p-2 cursor-pointer transition-all relative
                flex flex-col justify-center items-center
                ${day ? "hover:border-primary/50 hover:shadow-md" : ""}
                ${selectedDate === dateStr ? "ring-2 ring-primary" : ""}
                ${!day ? "bg-muted/20" : "bg-card"}
                ${shift?.notes ? "border-4 border-accent" : "border border-border"}
              `}
              style={shift ? getShiftStyle(day) : {}}
            >
              {day && (
                <>
                  <span
                    className={`text-sm font-semibold ${
                      shift?.type === "off" ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {day}
                  </span>
                  {shift && shift.type !== "off" && (
                    <span className="text-xs text-foreground/70 font-medium">{shift.hours}h</span>
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
