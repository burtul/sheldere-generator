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

// Вспомогательная функция для форматирования времени с минутами
function formatTimeWithMinutes(totalHours: number, totalMinutes: number): string {
  // Проверяем на NaN и устанавливаем значения по умолчанию
  const hours = isNaN(totalHours) ? 0 : totalHours;
  const minutes = isNaN(totalMinutes) ? 0 : totalMinutes;

  if (minutes === 0) {
    return `${hours}ч`;
  }
  return `${hours}ч ${minutes}м`;
}

// Функция для форматирования десятичных часов в часы и минуты
function formatDecimalHours(decimalHours: number): string {
  // Проверяем на NaN
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

export function MonthSummary({ shifts, monthlySettings, globalSettings }: MonthSummaryProps) {
  const [displayMonth, setDisplayMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  })

  const [year, monthNum] = displayMonth.split("-").map(Number)

  // Пересчитываем значения при изменении shifts, displayMonth или monthlySettings
  const { workedHours, workedMinutes, workedHours1To15, workedMinutes1To15, targetHours, progress, difference, advance } = useMemo(() => {
    let totalWorkedMinutes = 0;
    let totalWorkedMinutes1To15 = 0;

    // Перебираем все смены и суммируем минуты
    shifts.forEach((shift, dateKey) => {
      const [shiftYear, shiftMonth] = dateKey.split("-").map(Number);
      if (shiftYear === year && shiftMonth === monthNum) {
        const day = parseInt(dateKey.split("-")[2]);
        // Используем значения по умолчанию если undefined
        const hours = shift.hours || 0;
        const minutes = shift.minutes || 0;
        const shiftMinutes = hours * 60 + minutes;

        totalWorkedMinutes += shiftMinutes;
        if (day <= 15) {
          totalWorkedMinutes1To15 += shiftMinutes;
        }
      }
    });

    // Вычисляем часы и минуты
    const totalWorkedHours = Math.floor(totalWorkedMinutes / 60);
    const remainingMinutes = totalWorkedMinutes % 60;

    const totalWorkedHours1To15 = Math.floor(totalWorkedMinutes1To15 / 60);
    const remainingMinutes1To15 = totalWorkedMinutes1To15 % 60;

    const totalWorkedDecimal = totalWorkedMinutes / 60;

    // Рассчитываем целевые часы
    const workDays = getWorkDaysInMonth(year, monthNum - 1);
    const defaultTarget = workDays * 8;
    const target = monthlySettings.get(displayMonth)?.targetHours || defaultTarget;

    const prog = target > 0 ? (totalWorkedDecimal / target) * 100 : 0;
    const diff = target - totalWorkedDecimal;

    // Рассчитываем аванс
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
      progress: prog,
      difference: diff,
      advance: adv,
    };
  }, [shifts, displayMonth, monthlySettings, globalSettings.customNumber, year, monthNum]);

  const handlePrevMonth = () => {
    const date = new Date(year, monthNum - 2, 1);
    setDisplayMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const date = new Date(year, monthNum, 1);
    setDisplayMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const getStatusIcon = () => {
    const totalWorked = workedHours + workedMinutes / 60;
    if (totalWorked >= targetHours) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (totalWorked >= targetHours * 0.8) {
      return <TrendingUp className="h-5 w-5 text-blue-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const monthLabel = `${monthNames[monthNum - 1]} ${year}`;

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
          <span className="font-semibold text-foreground">
            {formatTimeWithMinutes(workedHours1To15, workedMinutes1To15)} / {formatTimeWithMinutes(workedHours, workedMinutes)}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Норма: {targetHours}ч</span>
          <span className={difference > 0 ? "text-yellow-500" : "text-green-500"}>
            {difference > 0 ?
              `${formatDecimalHours(difference)} осталось` :
              `+${formatDecimalHours(Math.abs(difference))} перер`}
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
  );
}