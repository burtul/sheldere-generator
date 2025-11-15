"use client"

import { useState, useMemo } from "react"
import type { Shift, MonthlySettings, GlobalSettings } from "@/lib/types"
import { getMonthHours, getWorkDaysInMonth, getMonthHoursFrom1To15 } from "@/lib/schedule-utils"
import { TrendingUp, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"

interface MonthSummaryProps {
  shifts: Map<string, Shift>
  monthlySettings: Map<string, MonthlySettings>
  globalSettings: GlobalSettings
}

export function MonthSummary({ shifts, monthlySettings, globalSettings }: MonthSummaryProps) {
  const [displayMonth, setDisplayMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  })

  const [year, monthNum] = displayMonth.split("-").map(Number)
  
  // Создаем ключ для отслеживания изменений смен в текущем месяце
  // Это гарантирует пересчет при редактировании календаря
  const shiftsKey = useMemo(() => {
    const monthShifts: string[] = []
    shifts.forEach((shift, dateKey) => {
      const [shiftYear, shiftMonth] = dateKey.split("-").map(Number)
      if (shiftYear === year && shiftMonth === monthNum) {
        monthShifts.push(`${dateKey}-${shift.hours}`)
      }
    })
    return monthShifts.sort().join("|")
  }, [shifts, year, monthNum])
  
  // Пересчитываем значения при изменении shifts, displayMonth или monthlySettings
  const { workedHours, workedHours1To15, targetHours, progress, difference, advance } = useMemo(() => {
    const worked = getMonthHours(shifts, year, monthNum)
    const worked1To15 = getMonthHoursFrom1To15(shifts, year, monthNum)
    const workDays = getWorkDaysInMonth(year, monthNum - 1)
    const defaultTarget = workDays * 8
    const target = monthlySettings.get(displayMonth)?.targetHours || defaultTarget
    const prog = target > 0 ? (worked / target) * 100 : 0
    const diff = target - worked
    
    // Рассчитываем аванс
    let adv = 0
    if (globalSettings.customNumber !== undefined && globalSettings.customNumber > 0 && target > 0) {
      adv = (worked1To15 / target) * globalSettings.customNumber
    }
    
    return {
      workedHours: worked,
      workedHours1To15: worked1To15,
      targetHours: target,
      progress: prog,
      difference: diff,
      advance: adv,
    }
  }, [shifts, shiftsKey, displayMonth, monthlySettings, globalSettings.customNumber, year, monthNum])

  const handlePrevMonth = () => {
    const date = new Date(year, monthNum - 2, 1)
    setDisplayMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`)
  }

  const handleNextMonth = () => {
    const date = new Date(year, monthNum, 1)
    setDisplayMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`)
  }

  const getStatusIcon = () => {
    if (workedHours >= targetHours) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (workedHours >= targetHours * 0.8) {
      return <TrendingUp className="h-5 w-5 text-blue-500" />
    } else {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
  const monthLabel = `${monthNames[monthNum - 1]} ${year}`

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-muted rounded transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center justify-between flex-1 px-2">
          <h3 className="font-semibold text-foreground">{monthLabel}</h3>
          {getStatusIcon()}
        </div>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-muted rounded transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Отработано</span>
          <span className="font-semibold text-foreground">{workedHours1To15}/{workedHours}ч</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Норма: {targetHours}h</span>
          <span className={difference > 0 ? "text-yellow-500" : "text-green-500"}>
            {difference > 0 ? `${difference}h осталось` : `+${Math.abs(difference)}ч перер`}
          </span>
        </div>
        {globalSettings.customNumber !== undefined && globalSettings.customNumber > 0 && targetHours > 0 && (
          <div className="flex justify-between text-sm pt-2 border-t border-border mt-2">
            <span className="text-muted-foreground">Аванс</span>
            <span className="font-semibold text-foreground">
              {Math.round(advance * 100) / 100} ₽
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
