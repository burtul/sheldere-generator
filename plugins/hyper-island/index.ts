import { registerPlugin } from "@capacitor/core"

/**
 * Режим Hyper Island для Xiaomi HyperOS.
 *
 * Системный островок недоступен сторонним приложениям напрямую, поэтому
 * приложение публикует обычное уведомление с обратным отсчётом, а
 * приложение Hyper Bridge превращает его в Hyper Island.
 *
 * Плагин только запускает/останавливает такой таймер и проверяет,
 * установлен ли Hyper Bridge.
 */

/** Состояние окружения Hyper Island. */
export interface HyperIslandAvailability {
  /** Установлен ли Hyper Bridge. */
  installed: boolean
  /** Похоже ли устройство на Xiaomi/Redmi/POCO. */
  deviceSupported: boolean
  /** Поддерживает ли прошивка нативные focus notifications HyperOS. */
  nativeSupported: boolean
  /** Разрешила ли система focus-уведомления этому приложению. */
  focusAllowed: boolean
  /** Запущен ли сейчас таймер Hyper Island. */
  running: boolean
}

export interface HyperIslandPlugin {
  /** Проверить наличие Hyper Bridge и состояние таймера. */
  isAvailable(): Promise<HyperIslandAvailability>

  /** Запустить таймер до `endsAt` (epoch ms). */
  start(options: { endsAt: number }): Promise<void>

  /** Обновить время окончания таймера. */
  update(options: { endsAt: number }): Promise<void>

  /** Остановить таймер и убрать уведомление. */
  stop(): Promise<void>

  /** Открыть Hyper Bridge (или его страницу в Google Play). */
  openHyperBridge(): Promise<void>
}

export const HyperIsland = registerPlugin<HyperIslandPlugin>("HyperIsland", {
  web: () => import("./hyper-island-web").then((m) => new m.HyperIslandWeb()),
})
