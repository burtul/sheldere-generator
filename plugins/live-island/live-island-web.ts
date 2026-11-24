import { WebPlugin } from "@capacitor/core"
import type {
  LiveIslandPlugin,
  LiveIslandPayload,
  LiveIslandStatus,
  LiveIslandSupport,
} from "./index"

const UNSUPPORTED: LiveIslandStatus = {
  supported: false,
  permission: false,
  running: false,
}

/**
 * Web-заглушка: в браузере плавающего островка нет, но интерфейс плагина
 * остаётся рабочим — приложение не падает и не ловит unhandled rejection.
 */
export class LiveIslandWeb extends WebPlugin implements LiveIslandPlugin {
  async isSupported(): Promise<LiveIslandSupport> {
    return { supported: false, androidSdk: 0 }
  }

  async getStatus(): Promise<LiveIslandStatus> {
    return { ...UNSUPPORTED }
  }

  async requestPermission(): Promise<LiveIslandStatus> {
    return { ...UNSUPPORTED }
  }

  async show(_options: LiveIslandPayload): Promise<void> {
    // В браузере островок не показывается.
  }

  async update(_options: LiveIslandPayload): Promise<void> {
    // В браузере островок не обновляется.
  }

  async hide(): Promise<void> {
    // В браузере скрывать нечего.
  }
}
