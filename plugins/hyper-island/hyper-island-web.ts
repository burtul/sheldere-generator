import { WebPlugin } from "@capacitor/core"
import type { HyperIslandAvailability, HyperIslandPlugin } from "./index"

const UNAVAILABLE: HyperIslandAvailability = {
  installed: false,
  deviceSupported: false,
  nativeSupported: false,
  focusAllowed: false,
  islandFeature: false,
  manufacturer: "",
  model: "",
  running: false,
}

/** В браузере Hyper Island недоступен. */
export class HyperIslandWeb extends WebPlugin implements HyperIslandPlugin {
  async isAvailable(): Promise<HyperIslandAvailability> {
    return { ...UNAVAILABLE }
  }

  async start(_options: { endsAt: number; textMode?: boolean }): Promise<void> {
    // В браузере таймер Hyper Island не запускается.
  }

  async update(_options: { endsAt: number; textMode?: boolean }): Promise<void> {
    // В браузере обновлять нечего.
  }

  async stop(): Promise<void> {
    // В браузере останавливать нечего.
  }

  async openHyperBridge(): Promise<void> {
    if (typeof window !== "undefined") {
      window.open("https://play.google.com/store/apps/details?id=com.d4viddf.hyperbridge", "_blank")
    }
  }

  async openNotificationSettings(): Promise<void> {
    // В браузере нет системных настроек уведомлений приложения.
  }
}
