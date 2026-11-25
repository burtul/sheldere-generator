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

/**
 * Для ночных смен конец считается не по «оплаченным» часам, а по реальному
 * окончанию в 08:00. В расписании «Ночная1» хранится как 4 часа
 * (20:00–00:00), но фактически смена идёт до утра — иначе таймер упирается
 * в полночь.
 */
const FIXED_SHIFT_END_TIMES: Partial<Record<ShiftType, ShiftStartTime>> = {
  night: { hours: 8, minutes: 0 },
  night2: { hours: 8, minutes: 0 },
  offn: { hours: 8, minutes: 0 },
}

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

/** Окно смены для конкретного календарного дня (без перехода на следующую дату). */
function buildShiftWindowForDay(shift: Shift, day: Date): ShiftWindow | null {
  const startTime = DEFAULT_SHIFT_START_TIMES[shift.type]
  if (!startTime) return null

  const start = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    startTime.hours,
    startTime.minutes,
  )

  const fixedEnd = FIXED_SHIFT_END_TIMES[shift.type]
  let end: Date

  if (fixedEnd) {
    end = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      fixedEnd.hours,
      fixedEnd.minutes,
    )
    // Ночная смена 20:00 → 08:00 переходит на следующие сутки.
    if (end.getTime() <= start.getTime()) {
      end = new Date(end.getTime() + DAY_MS)
    }
  } else {
    end = new Date(start.getTime() + getShiftDurationMinutes(shift) * MINUTE_MS)
  }

  return {
    start,
    end,
    durationMinutes: Math.round((end.getTime() - start.getTime()) / MINUTE_MS),
  }
}

/**
 * Окно ближайшей смены: сегодняшнее, а если оно уже закончилось — завтрашнее.
 *
 * Сохраняет прежнее поведение таймера: после окончания смены отсчёт
 * продолжается до конца следующей смены (а не до её начала).
 */
export function getShiftWindow(shift: Shift | null | undefined, now: Date = new Date()): ShiftWindow | null {
  if (!shift || !isWorkShift(shift)) return null

  const today = buildShiftWindowForDay(shift, now)
  if (!today) return null

  if (now.getTime() >= today.end.getTime()) {
    const nextDay = new Date(today.start.getTime() + DAY_MS)
    return buildShiftWindowForDay(shift, nextDay) ?? today
  }

  return today
}

/**
 * Окно смены, только если она идёт прямо сейчас.
 * Проверяет и сегодняшний, и вчерашний день — ночная смена могла начаться вчера.
 */
export function getActiveShiftWindow(
  shift: Shift | null | undefined,
  now: Date = new Date(),
): ShiftWindow | null {
  if (!shift || !isWorkShift(shift)) return null

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - DAY_MS)

  for (const day of [today, yesterday]) {
    const window = buildShiftWindowForDay(shift, day)
    if (!window) continue

    const time = now.getTime()
    if (time >= window.start.getTime() && time < window.end.getTime()) {
      return window
    }
  }

  return null
}

/** Сколько минут осталось до конца окна смены (не меньше нуля). */
export function getRemainingMinutes(window: ShiftWindow, now: Date = new Date()): number {
  return Math.max(0, Math.floor((window.end.getTime() - now.getTime()) / MINUTE_MS))
}

/** Переходит ли окно смены через полночь. */
export function crossesMidnight(start: Date, end: Date): boolean {
  return (
    start.getFullYear() !== end.getFullYear() ||
    start.getMonth() !== end.getMonth() ||
    start.getDate() !== end.getDate()
  )
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

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Ищет смену, которая идёт прямо сейчас, включая ночную смену,
 * начавшуюся вчера и переходящую через полночь.
 */
export function findActiveShift(
  shifts: Map<string, Shift>,
  now: Date = new Date(),
): Shift | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - DAY_MS)

  for (const date of [today, yesterday]) {
    const shift = shifts.get(localDateKey(date))
    if (!shift || !isWorkShift(shift)) continue

    const window = buildShiftWindowForDay(shift, date)
    if (
      window &&
      now.getTime() >= window.start.getTime() &&
      now.getTime() < window.end.getTime()
    ) {
      return shift
    }
  }

  return null
}
