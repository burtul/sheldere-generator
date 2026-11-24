import type { Shift, ShiftType } from "./types"

/**
 * Единый источник правды для расчёта времени смены.
 *
 * Раньше эта логика была продублирована в `app/page.tsx` (для foreground-сервиса)
 * и в `hooks/use-shift-timer.ts`. Теперь её используют оба места, а также
 * live-островок (`hooks/use-live-shift-indicator.ts`).
 */

export interface ShiftStartTime {
  hours: number
  minutes: number
}

/** Стандартные времена начала смен по типу. */
export const DEFAULT_SHIFT_START_TIMES: Record<ShiftType, ShiftStartTime> = {
  day: { hours: 8, minutes: 0 },
  night: { hours: 20, minutes: 0 },
  night2: { hours: 20, minutes: 0 },
  off: { hours: 0, minutes: 0 },
  offn: { hours: 0, minutes: 0 },
  weekday: { hours: 8, minutes: 0 },
  weekday15: { hours: 8, minutes: 0 },
  weekday7: { hours: 8, minutes: 0 },
}

const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

/** Окно смены: начало, конец и длительность. */
export interface ShiftWindow {
  start: Date
  end: Date
  durationMinutes: number
}

/** Длительность смены в минутах. */
export function getShiftDurationMinutes(shift: Shift): number {
  return Math.max(0, shift.hours * 60 + shift.minutes)
}

/** Рабочая ли это смена (не выходной и не пустая). */
export function isWorkShift(shift: Shift | null | undefined): boolean {
  if (!shift) return false
  if (shift.type === "off" || shift.type === "offn") return false
  return getShiftDurationMinutes(shift) > 0
}

/**
 * Окно ближайшей смены: сегодняшнее, а если оно уже закончилось — завтрашнее.
 *
 * Сохраняет прежнее поведение таймера: после окончания смены отсчёт
 * продолжается до конца следующей смены (а не до её начала).
 */
export function getShiftWindow(shift: Shift | null | undefined, now: Date = new Date()): ShiftWindow | null {
  if (!shift || !isWorkShift(shift)) return null

  const startTime = DEFAULT_SHIFT_START_TIMES[shift.type]
  if (!startTime) return null

  const durationMinutes = getShiftDurationMinutes(shift)
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    startTime.hours,
    startTime.minutes,
  )
  const end = new Date(start.getTime() + durationMinutes * MINUTE_MS)

  if (now.getTime() >= end.getTime()) {
    const nextStart = new Date(start.getTime() + DAY_MS)
    return {
      start: nextStart,
      end: new Date(nextStart.getTime() + durationMinutes * MINUTE_MS),
      durationMinutes,
    }
  }

  return { start, end, durationMinutes }
}

/** Окно смены, только если она идёт прямо сейчас. */
export function getActiveShiftWindow(
  shift: Shift | null | undefined,
  now: Date = new Date(),
): ShiftWindow | null {
  const window = getShiftWindow(shift, now)
  if (!window) return null

  const time = now.getTime()
  const isActive = time >= window.start.getTime() && time < window.end.getTime()
  return isActive ? window : null
}

/** Сколько минут осталось до конца окна смены (не меньше нуля). */
export function getRemainingMinutes(window: ShiftWindow, now: Date = new Date()): number {
  return Math.max(0, Math.floor((window.end.getTime() - now.getTime()) / MINUTE_MS))
}

/** Формат `HH:MM` из количества минут. */
export function formatRemaining(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes))
  const hours = Math.floor(safeMinutes / 60)
  const rest = safeMinutes % 60
  return `${hours.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`
}

/** Оставшееся время до конца смены в формате `HH:MM` или `null`, если смены нет. */
export function formatShiftRemaining(
  shift: Shift | null | undefined,
  now: Date = new Date(),
): string | null {
  const window = getShiftWindow(shift, now)
  return window ? formatRemaining(getRemainingMinutes(window, now)) : null
}
