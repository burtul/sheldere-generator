"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import type { Shift, MonthlySettings, GlobalSettings, Holiday } from "@/lib/types"
import { getMonthHours, getWorkDaysInMonth, getMonthHoursFrom1To15, generateSchedule, generate5DaySchedule, generate5DaySchedule15 } from "@/lib/schedule-utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { exampleHolidays } from "@/lib/holidays";


interface MonthSummaryProps {
  shifts: Map<string, Shift>
  monthlySettings: Map<string, MonthlySettings>
  globalSettings: GlobalSettings
  currentMonth?: string
  onGenerateSchedule?: (shifts: Map<string, Shift>, startDate: Date) => void
  selectedTeam?: string
  scheduleType?: "2x2" | "5days"
  schedule5DayType?: "8hours" | "8-15"
}

// Вспомогательная функция для форматирования времени с минутами
function formatTimeWithMinutes(totalHours: number, totalMinutes: number): string {
  const hours = isNaN(totalHours) ? 0 : totalHours;
  const minutes = isNaN(totalMinutes) ? 0 : totalMinutes;

  if (minutes === 0) {
    return `${hours}ч`;
  }
  return `${hours}ч ${minutes}м`;
}

// Функция для форматирования десятичных часов в часы и минуты
function formatDecimalHours(decimalHours: number): string {
  if (isNaN(decimalHours)) {
    return "0ч";
  }

  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}ч`;
  }
  return `${hours}ч ${minutes}м`;
}

export function MonthSummary({ shifts, monthlySettings, globalSettings, currentMonth, onGenerateSchedule, selectedTeam, scheduleType = "2x2", schedule5DayType = "8hours" }: MonthSummaryProps) {
  const [displayMonth, setDisplayMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  })

  const processedMonthsRef = useRef<Set<string>>(new Set())

  const holidaySet = useMemo(() => {
    return new Set(exampleHolidays.map(h => h.date));
  }, []);

  // цвет праздничных дней

  const getHolidayHoursColor = (minutes: number) => {
    if (minutes > 0) return "text-green-500";
    return "text-muted-foreground";
  };

  // Синхронизируем displayMonth с currentMonth из календаря
  useEffect(() => {
    if (currentMonth) {
      setDisplayMonth(currentMonth)
    }
  }, [currentMonth])

  // Сбрасываем обработанные месяцы при изменении бригады
  useEffect(() => {
    processedMonthsRef.current.clear()
  }, [selectedTeam, scheduleType, schedule5DayType])

  const [year, monthNum] = displayMonth.split("-").map(Number)
  const monthKey = `${year}-${monthNum}`

  // Автогенерация смен для текущего месяца, если их нет
  useEffect(() => {
    if (!selectedTeam || !onGenerateSchedule || processedMonthsRef.current.has(monthKey)) return

    let needsExtension = false
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      if (!shifts.has(dateStr)) {
        needsExtension = true
        break
      }
    }

    if (!needsExtension) {
      processedMonthsRef.current.add(monthKey)
      return
    }

    const startDate = new Date(year, monthNum - 1, 1)
    let newShifts: Map<string, Shift>

    if (scheduleType === "5days") {
      if (schedule5DayType === "8hours") {
        newShifts = generate5DaySchedule(startDate, 7200)
      } else {
        newShifts = generate5DaySchedule15(startDate, 7200)
      }
    } else {
      newShifts = generateSchedule(
        startDate,
        7200,
        selectedTeam as any
      )
    }

    onGenerateSchedule(newShifts, startDate)
    processedMonthsRef.current.add(monthKey)

  }, [year, monthNum, selectedTeam, onGenerateSchedule, monthKey, scheduleType, schedule5DayType])

  // Пересчитываем значения при изменении shifts, displayMonth или monthlySettings
  const {
    workedHours,
    workedMinutes,
    workedHours1To15,
    workedMinutes1To15,
    targetHours,
    difference,
    advance,
    holidayHours,
    holidayMinutes,
    totalHolidayHours,
    totalHolidayMinutes
  } =
    useMemo(() => {
      let totalWorkedMinutes = 0;
      let totalWorkedMinutes1To15 = 0;
      let totalHolidayMinutes = 0;
      let totalHolidayMinutes1To15 = 0;

      shifts.forEach((shift, dateKey) => {
        const [shiftYear, shiftMonth, shiftDay] = dateKey.split("-").map(Number);

        if (shiftYear === year && shiftMonth === monthNum) {
          const hours = !isNaN(shift.hours ?? NaN) ? shift.hours! : 0;
          const minutes = !isNaN(shift.minutes ?? NaN) ? shift.minutes! : 0;
          const shiftMinutes = hours * 60 + minutes;

          totalWorkedMinutes += shiftMinutes;

          if (shiftDay <= 15) {
            totalWorkedMinutes1To15 += shiftMinutes;
          }

          // ✅ Проверка на праздничный день
          const isHoliday = holidaySet.has(dateKey);

          if (isHoliday) {
            totalHolidayMinutes += shiftMinutes;

            if (shiftDay <= 15) {
              totalHolidayMinutes1To15 += shiftMinutes;
            }
          }
        }
      });


      const totalWorkedHours = Math.floor(totalWorkedMinutes / 60);
      const remainingMinutes = totalWorkedMinutes % 60;

      const totalWorkedHours1To15 = Math.floor(totalWorkedMinutes1To15 / 60);
      const remainingMinutes1To15 = totalWorkedMinutes1To15 % 60;

      const totalHolidayHours = Math.floor(totalHolidayMinutes / 60);
      const remainingHolidayMinutes = totalHolidayMinutes % 60;

      const totalHolidayHours1To15 = Math.floor(totalHolidayMinutes1To15 / 60);
      const remainingHolidayMinutes1To15 = totalHolidayMinutes1To15 % 60;

      const totalWorkedDecimal = totalWorkedMinutes / 60;

      const workDays = getWorkDaysInMonth(year, monthNum - 1);
      const defaultTarget = workDays * 8;
      const target = monthlySettings.get(displayMonth)?.targetHours || defaultTarget;

      const diff = target - totalWorkedDecimal;

      let adv = 0;
      if (globalSettings.customNumber !== undefined && globalSettings.customNumber > 0 && target > 0) {
        adv = (totalWorkedMinutes1To15 / 60 / target) * globalSettings.customNumber;
      }

      return {
        workedHours: totalWorkedHours,
        workedMinutes: remainingMinutes,

        workedHours1To15: totalWorkedHours1To15,
        workedMinutes1To15: remainingMinutes1To15,

        targetHours: target,
        difference: diff,
        advance: adv,

        holidayHours: totalHolidayHours1To15,
        holidayMinutes: remainingHolidayMinutes1To15,

        totalHolidayHours: totalHolidayHours,
        totalHolidayMinutes: remainingHolidayMinutes,
      };
    }, [shifts, displayMonth, monthlySettings, globalSettings.customNumber, year, monthNum, scheduleType, schedule5DayType])

  const handlePrevMonth = () => {
    const date = new Date(year, monthNum - 2, 1);
    setDisplayMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const date = new Date(year, monthNum, 1);
    setDisplayMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const monthLabel = `${monthNames[monthNum - 1]} ${year}`;

  const getAdvanceColor = () => {
    if (globalSettings.customNumber !== undefined && globalSettings.customNumber > 0) {
      const halfSalary = globalSettings.customNumber / 2;
      if (advance >= halfSalary) {
        return "text-green-500";
      } else {
        return "text-yellow-500";
      }
    }
    return "text-foreground";
  };

  return (
    <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 text-center">
          <h3 className="text-lg font-semibold text-foreground">{monthLabel}</h3>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="flex justify-between items-center text-base mb-1">
            <span className="text-muted-foreground font-medium">Отработано</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold">
            <span className="text-foreground text-center flex-1 border-r border-border pr-2">{formatTimeWithMinutes(workedHours1To15, workedMinutes1To15)}</span>
            <span className="text-foreground text-center flex-1 pl-2">{formatTimeWithMinutes(workedHours, workedMinutes)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
            <span className="text-center flex-1">До 15 числа</span>
            <span className="text-center flex-1">Всего</span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="flex justify-between items-center text-base mb-1">
            <span className="text-muted-foreground font-medium">Норма</span>
            <span className="text-muted-foreground font-medium">Осталось</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold">
            <span className="text-foreground text-center flex-1 border-r border-border pr-2">{targetHours}ч</span>
            <span className={`font-medium text-center flex-1 pl-2 ${difference > 0 ? "text-yellow-500" : "text-green-500"}`}>
              {difference > 0 ?
                `${formatDecimalHours(difference)}` :
                `+${formatDecimalHours(Math.abs(difference))}`}
            </span>
          </div>
        </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="flex justify-between items-center text-base mb-1">
              <span className="text-muted-foreground font-medium">Праздничные часы</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold">
              <span
              className={`text-center flex-1 pl-2 ${getHolidayHoursColor(
                totalHolidayHours * 60 + totalHolidayMinutes
              )}`}
            >
              {formatTimeWithMinutes(totalHolidayHours, totalHolidayMinutes)}
            </span>
            </div>
          </div>

        {globalSettings.customNumber !== undefined && globalSettings.customNumber > 0 && targetHours > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="flex justify-between items-center text-base mb-1">
              <span className="text-muted-foreground font-medium">Аванс</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold">
              <span className={`text-center flex-1 ${getAdvanceColor()}`}>
                {Math.round(advance * 100) / 100} ₽
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}