"use client"

import { useCallback, useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { ForegroundService } from "@/plugins/foreground-service"
import { LiveIsland, getLiveIslandStatus, hideLiveIsland } from "@/plugins/live-island"
import {
  formatRemaining,
  getActiveShiftWindow,
  getRemainingMinutes,
  getShiftWindow,
} from "@/lib/shift-timing"
import type { Shift } from "@/lib/types"

export type LiveIndicatorMode = "island" | "notification" | "off"

export interface LiveShiftIndicator {
  /** Где сейчас показывается таймер: плавающий островок, уведомление или нигде. */
  mode: LiveIndicatorMode
  /** Поддерживает ли устройство плавающий островок. */
  islandSupported: boolean
  /** Выдано ли разрешение «Поверх других приложений». */
  islandPermission: boolean
  /** Включён ли островок пользователем. */
  islandEnabled: boolean
  /** Включить/выключить островок (сохраняется в localStorage). */
  setIslandEnabled: (enabled: boolean) => void
  /** Открыть системный экран выдачи разрешения. */
  requestIslandPermission: () => Promise<void>
  /** Перечитать состояние разрешения (например, после возврата в приложение). */
  refreshIslandStatus: () => Promise<void>
}

const ISLAND_ENABLED_KEY = "liveIslandEnabled"
const LIVE_UPDATE_INTERVAL_MS = 60_000

function readIslandEnabled(): boolean {
  if (typeof window === "undefined") return true
  const saved = window.localStorage.getItem(ISLAND_ENABLED_KEY)
  return saved === null ? true : saved !== "false"
}

/**
 * Держит live-индикатор смены в актуальном состоянии.
 *
 * Приоритет:
 * 1. Плавающий островок (Android, есть разрешение «Поверх других приложений»).
 * 2. Foreground-уведомление (прежнее поведение, а также web/устройства без островка).
 * 3. Ничего, если таймер выключен или смены нет.
 *
 * Островок показывается только во время смены, уведомление — по прежней логике
 * (отсчёт до конца текущей или следующей смены).
 */
export function useLiveShiftIndicator(
  currentShift: Shift | null,
  isEnabled: boolean = true,
): LiveShiftIndicator {
  const [mode, setMode] = useState<LiveIndicatorMode>("off")
  const [islandSupported, setIslandSupported] = useState(false)
  const [islandPermission, setIslandPermission] = useState(false)
  // Значение по умолчанию одинаково на сервере и клиенте,
  // сохранённую настройку читаем после монтирования.
  const [islandEnabled, setIslandEnabledState] = useState(true)

  useEffect(() => {
    setIslandEnabledState(readIslandEnabled())
  }, [])

  const setIslandEnabled = useCallback((enabled: boolean) => {
    setIslandEnabledState(enabled)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ISLAND_ENABLED_KEY, String(enabled))
    }
  }, [])

  const refreshIslandStatus = useCallback(async () => {
    if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
      setIslandSupported(false)
      setIslandPermission(false)
      return
    }

    const status = await getLiveIslandStatus()
    setIslandSupported(status.supported)
    setIslandPermission(status.permission)
  }, [])

  const requestIslandPermission = useCallback(async () => {
    try {
      const status = await LiveIsland.requestPermission()
      setIslandSupported(status.supported)
      setIslandPermission(status.permission)
    } catch {
      // Плагин недоступен — оставляем уведомление как fallback.
    }
  }, [])

  // Первичная проверка поддержки и разрешения.
  useEffect(() => {
    void refreshIslandStatus()
  }, [refreshIslandStatus])

  // Пользователь возвращается из настроек разрешений — перечитываем статус.
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshIslandStatus()
      }
    }

    window.addEventListener("focus", handleVisibility)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("focus", handleVisibility)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [refreshIslandStatus])

  // Основная синхронизация индикатора с текущей сменой.
  useEffect(() => {
    const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform()

    if (!isNative || !isEnabled || !currentShift) {
      void hideLiveIsland()
      void ForegroundService.stopTimerService().catch(() => {})
      setMode("off")
      return
    }

    const useIsland = islandSupported && islandPermission && islandEnabled

    if (useIsland) {
      let alive = true
      let shown = false
      setMode("island")

      const syncIsland = async () => {
        const shiftWindow = getActiveShiftWindow(currentShift, new Date())

        if (!shiftWindow) {
          // Смена ещё не началась или уже закончилась — островок не нужен.
          if (shown) {
            shown = false
            await hideLiveIsland()
          }
          if (alive) setMode("off")
          return
        }

        const remaining = formatRemaining(getRemainingMinutes(shiftWindow, new Date()))
        const payload = { endsAt: shiftWindow.end.getTime(), remaining }

        try {
          if (shown) {
            await LiveIsland.update(payload)
          } else {
            await LiveIsland.show(payload)
            shown = true
          }
          if (alive) setMode("island")
        } catch {
          // Разрешение отозвали или сервис не запустился — уходим в уведомление.
          shown = false
          if (alive) {
            setIslandPermission(false)
            setMode("notification")
          }
        }
      }

      void syncIsland()
      const interval = window.setInterval(() => {
        void syncIsland()
      }, LIVE_UPDATE_INTERVAL_MS)

      return () => {
        alive = false
        window.clearInterval(interval)
        if (shown) {
          shown = false
          void hideLiveIsland()
        }
      }
    }

    // Fallback: foreground-уведомление в статус-баре (прежнее поведение).
    let alive = true
    let started = false
    setMode("notification")

    const syncNotification = () => {
      const shiftWindow = getShiftWindow(currentShift, new Date())

      if (!shiftWindow) {
        if (started) {
          started = false
          void ForegroundService.stopTimerService().catch(() => {})
        }
        if (alive) setMode("off")
        return
      }

      const remaining = formatRemaining(getRemainingMinutes(shiftWindow, new Date()))

      if (started) {
        void ForegroundService.updateTimerService(remaining).catch(() => {})
      } else {
        started = true
        void ForegroundService.startTimerService(remaining).catch(() => {})
      }
    }

    syncNotification()
    const interval = window.setInterval(syncNotification, LIVE_UPDATE_INTERVAL_MS)

    return () => {
      alive = false
      window.clearInterval(interval)
      if (started) {
        started = false
        void ForegroundService.stopTimerService().catch(() => {})
      }
    }
  }, [currentShift, isEnabled, islandEnabled, islandPermission, islandSupported])

  return {
    mode,
    islandSupported,
    islandPermission,
    islandEnabled,
    setIslandEnabled,
    requestIslandPermission,
    refreshIslandStatus,
  }
}
