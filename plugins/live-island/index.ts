import { registerPlugin } from "@capacitor/core"

/**
 * Live-островок («островок в районе камеры») — аналог Dynamic Island на Android.
 *
 * Нативная часть рисует компактную пилюлю поверх других приложений через
 * `WindowManager` (TYPE_APPLICATION_OVERLAY) в верхней части экрана, вровень
 * с вырезом камеры, и показывает время до конца смены.
 *
 * Плагин намеренно не знает о сменах и расписании: он умеет только показать,
 * обновить и скрыть островок. Синхронизацию с расписанием делает
 * `hooks/use-live-shift-indicator.ts`.
 */

/** Данные, которые показывает островок. */
export interface LiveIslandPayload {
  /**
   * Момент окончания смены (epoch ms). Нативный сервис сам считает остаток,
   * поэтому таймер продолжает идти, даже когда приложение свёрнуто.
   */
  endsAt: number
  /** Оставшееся время в формате `HH:MM` для первого кадра. Необязательно. */
  remaining?: string
  /**
   * Смещение островка от верхнего края экрана в dp.
   * `0` — вровень с вырезом камеры; по умолчанию столько же.
   */
  topOffset?: number
}

/** Текущее состояние островка. */
export interface LiveIslandStatus {
  /** Поддерживает ли устройство/система плавающее окно. */
  supported: boolean
  /** Выдано ли разрешение «Поверх других приложений». */
  permission: boolean
  /** Запущен ли сервис островка. */
  running: boolean
}

/** Ответ `isSupported`. */
export interface LiveIslandSupport {
  supported: boolean
  androidSdk: number
}

export interface LiveIslandPlugin {
  /** Поддерживается ли островок на этой платформе (Android). */
  isSupported(): Promise<LiveIslandSupport>

  /** Текущее состояние: поддержка, разрешение, запущен ли сервис. */
  getStatus(): Promise<LiveIslandStatus>

  /**
   * Открывает системный экран выдачи разрешения «Поверх других приложений».
   * Результат нужно перепроверить через `getStatus()` после возврата в приложение.
   */
  requestPermission(): Promise<LiveIslandStatus>

  /** Показать островок (запускает foreground-сервис). */
  show(options: LiveIslandPayload): Promise<void>

  /** Обновить текст на уже показанном островке. */
  update(options: LiveIslandPayload): Promise<void>

  /**
   * Сдвинуть островок на `dx`/`dy` (в dp).
   * Работает, даже когда капсула лежит в зоне статус-бара, недоступной касаниям.
   */
  moveBy(options: { dx: number; dy: number }): Promise<void>

  /** Вернуть островок по центру верхней кромки и забыть сохранённую позицию. */
  resetPosition(): Promise<void>

  /** Скрыть островок и остановить сервис. */
  hide(): Promise<void>
}

export const LiveIsland = registerPlugin<LiveIslandPlugin>("LiveIsland", {
  web: () => import("./live-island-web").then((m) => new m.LiveIslandWeb()),
})

const UNSUPPORTED: LiveIslandStatus = {
  supported: false,
  permission: false,
  running: false,
}

/**
 * Безопасно читает состояние островка.
 * На web, в SSR и при отсутствии нативного плагина возвращает «не поддерживается».
 */
export async function getLiveIslandStatus(): Promise<LiveIslandStatus> {
  try {
    return await LiveIsland.getStatus()
  } catch {
    return { ...UNSUPPORTED }
  }
}

/** Показывает островок, если платформа это позволяет; иначе бросает ошибку. */
export async function showLiveIsland(payload: LiveIslandPayload): Promise<void> {
  await LiveIsland.show(payload)
}

/** Обновляет показанный островок. */
export async function updateLiveIsland(payload: LiveIslandPayload): Promise<void> {
  await LiveIsland.update(payload)
}

/** Скрывает островок, не бросая ошибку при отсутствии плагина. */
export async function hideLiveIsland(): Promise<void> {
  try {
    await LiveIsland.hide()
  } catch {
    // Плагин недоступен (web/SSR) — скрывать нечего.
  }
}
