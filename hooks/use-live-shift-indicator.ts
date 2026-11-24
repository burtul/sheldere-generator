"use client"

import { useCallback, useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { ForegroundService } from "@/plugins/foreground-service"
import { LiveIsland, getLiveIslandStatus, hideLiveIsland } from "@/plugins/live-island"
import { HyperIsland } from "@/plugins/hyper-island"
import {
  formatRemaining,
  getActiveShiftWindow,
  getRemainingMinutes,
  getShiftWindow,
} from "@/lib/shift-timing"
import type { Shift } from "@/lib/types"

export type LiveIndicatorMode = "hyper" | "island" | "notification" | "off"

export interface LiveShiftIndicator {
  /** Где сейчас показывается таймер: Hyper Island, наш островок, уведомление или нигде. */
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
  /** Сдвинуть островок на dx/dy в dp. */
  moveIslandBy: (dx: number, dy: number) => Promise<void>
  /** Вернуть островок по центру верхней кромки. */
  resetIslandPosition: () => Promise<void>
  /** Установлен ли Hyper Bridge. */
  hyperBridgeInstalled: boolean
  /** Похоже ли устройство на Xiaomi/Redmi/POCO. */
  hyperDeviceSupported: boolean
  /** Включён ли режим Hyper Island. */
  hyperEnabled: boolean
  /** Включить/выключить режим Hyper Island. */
  setHyperEnabled: (enabled: boolean) => void
  /** Открыть Hyper Bridge или его страницу в Google Play. */
  openHyperBridge: () => Promise<void>
}

const ISLAND_ENABLED_KEY = "liveIslandEnabled"
const HYPER_ENABLED_KEY = "hyperIslandEnabled"
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
 * 1. Hyper Island (Xiaomi HyperOS) — уведомление-таймер для Hyper Bridge.
 * 2. Плавающий островок (Android, есть разрешение «Поверх других приложений»).
 * 3. Foreground-уведомление (прежнее поведение, web и устройства без островка).
 * 4. Ничего, если таймер выключен или смены нет.
 *
 * Островок и Hyper Island показываются только во время смены, уведомление —
 * по прежней логике (отсчёт до конца текущей или следующей смены).
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
  const [hyperEnabled, setHyperEnabledState] = useState(false)
  const [hyperBridgeInstalled, setHyperBridgeInstalled] = useState(false)
  const [hyperDeviceSupported, setHyperDeviceSupported] = useState(false)

  useEffect(() => {
    setIslandEnabledState(readIslandEnabled())
  }, [])

  const setIslandEnabled = useCallback((enabled: boolean) => {
    setIslandEnabledState(enabled)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ISLAND_ENABLED_KEY, String(enabled))
    }
  }, [])

  const setHyperEnabled = useCallback((enabled: boolean) => {
    setHyperEnabledState(enabled)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HYPER_ENABLED_KEY, String(enabled))
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

  const refreshHyperStatus = useCallback(async () => {
    if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
      setHyperBridgeInstalled(false)
      setHyperDeviceSupported(false)
      return
    }

    try {
      const status = await HyperIsland.isAvailable()
      setHyperBridgeInstalled(status.installed)
      setHyperDeviceSupported(status.deviceSupported)

      // Если Hyper Bridge установлен, а выбора ещё не было — включаем режим.
      const saved = window.localStorage.getItem(HYPER_ENABLED_KEY)
      if (saved === null && status.installed) {
        setHyperEnabledState(true)
        window.localStorage.setItem(HYPER_ENABLED_KEY, "true")
      }
    } catch {
      setHyperBridgeInstalled(false)
      setHyperDeviceSupported(false)
    }
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

  const moveIslandBy = useCallback(async (dx: number, dy: number) => {
    try {
      await LiveIsland.moveBy({ dx, dy })
    } catch {
      // Островок не запущен или плагин недоступен.
    }
  }, [])

  const resetIslandPosition = useCallback(async () => {
    try {
      await LiveIsland.resetPosition()
    } catch {
      // Островок не запущен или плагин недоступен.
    }
  }, [])

  const openHyperBridge = useCallback(async () => {
    try {
      await HyperIsland.openHyperBridge()
    } catch {
      // Не удалось открыть Hyper Bridge — ничего страшного.
    }
  }, [])

  // Первичная проверка окружения.
  useEffect(() => {
    void refreshIslandStatus()
    void refreshHyperStatus()
  }, [refreshIslandStatus, refreshHyperStatus])

  // Пользователь возвращается из настроек — перечитываем статусы.
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshIslandStatus()
        void refreshHyperStatus()
      }
    }

    window.addEventListener("focus", handleVisibility)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("focus", handleVisibility)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [refreshIslandStatus, refreshHyperStatus])

  // Основная синхронизация индикатора с текущей сменой.
  useEffect(() => {
    const isNative = typeof window !== "undefined" && Capacitor.isNativePlatform()

    if (!isNative || !isEnabled || !currentShift) {
      void hideLiveIsland()
      void HyperIsland.stop().catch(() => {})
      void ForegroundService.stopTimerService().catch(() => {})
      setMode("off")
      return
    }

    const useHyper = hyperEnabled && hyperBridgeInstalled
    const useIsland = islandSupported && islandPermission && islandEnabled

    if (useHyper) {
      let alive = true
      let startedEndsAt: number | null = null
      setMode("hyper")

      // В режиме Hyper Island наш плавающий островок не нужен.
      void hideLiveIsland()
      void ForegroundService.stopTimerService().catch(() => {})

      const syncHyper = async () => {
        const shiftWindow = getActiveShiftWindow(currentShift, new Date())

        if (!shiftWindow) {
          if (startedEndsAt !== null) {
            startedEndsAt = null
            await HyperIsland.stop().catch(() => {})
          }
          if (alive) setMode("off")
          return
        }

        const endsAt = shiftWindow.end.getTime()

        try {
          if (startedEndsAt === null) {
            await HyperIsland.start({ endsAt })
            startedEndsAt = endsAt
          } else if (startedEndsAt !== endsAt) {
            await HyperIsland.update({ endsAt })
            startedEndsAt = endsAt
          }
          if (alive) setMode("hyper")
        } catch {
          startedEndsAt = null
          if (alive) setMode("off")
        }
      }

      void syncHyper()
      const interval = window.setInterval(() => {
        void syncHyper()
      }, LIVE_UPDATE_INTERVAL_MS)

      return () => {
        alive = false
        window.clearInterval(interval)
        void HyperIsland.stop().catch(() => {})
      }
    }

    if (useIsland) {
      let alive = true
      let shown = false
      setMode("island")

      void HyperIsland.stop().catch(() => {})
      void ForegroundService.stopTimerService().catch(() => {})

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

    void hideLiveIsland()
    void HyperIsland.stop().catch(() => {})

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
  }, [
    currentShift,
    isEnabled,
    islandEnabled,
    islandPermission,
    islandSupported,
    hyperEnabled,
    hyperBridgeInstalled,
  ])

  return {
    mode,
    islandSupported,
    islandPermission,
    islandEnabled,
    setIslandEnabled,
    requestIslandPermission,
    refreshIslandStatus,
    moveIslandBy,
    resetIslandPosition,
    hyperBridgeInstalled,
    hyperDeviceSupported,
    hyperEnabled,
    setHyperEnabled,
    openHyperBridge,
  }
}
