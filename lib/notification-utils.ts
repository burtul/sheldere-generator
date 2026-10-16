import type { Shift } from "./types"
import { Capacitor } from "@capacitor/core"
import { LocalNotifications, type LocalNotificationSchema } from "@capacitor/local-notifications"

// Новый ID канала нужен потому, что Android не меняет звук уже созданного канала.
// Файл звука должен лежать в android/app/src/main/res/raw/alarm.(wav|mp3|ogg).
export const NOTIFICATION_CHANNEL_ID = "reminders_channel_v2"

let channelReady = false
let syncInProgress = false

export const ensureNotificationChannel = async () => {
  if (!Capacitor.isNativePlatform() || channelReady) return
  try {
    const { display } = await LocalNotifications.checkPermissions()
    if (display !== "granted") {
      const requested = await LocalNotifications.requestPermissions()
      if (requested.display !== "granted") return
    }

    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: "Напоминания",
      description: "Напоминания из графика смен",
      importance: 5,
      visibility: 1,
      sound: "alarm",
      lights: true,
      vibration: true,
    })
    channelReady = true
  } catch (error) {
    console.error("Ошибка настройки канала уведомлений:", error)
  }
}

export const cancelNotification = async (notificationId: string) => {
  if (!Capacitor.isNativePlatform()) return
  const id = Number(notificationId)
  if (!Number.isSafeInteger(id)) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id }] })
  } catch (error) {
    console.error("Ошибка отмены уведомления:", error)
  }
}

export const cancelAllNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return
  try {
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(({ id }) => ({ id })),
      })
    }
  } catch (error) {
    console.error("Ошибка отмены уведомлений:", error)
  }
}

const toLocalDate = (dateKey: string, time: string): Date | null => {
  const [year, month, day] = dateKey.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  if (![year, month, day, hours, minutes].every(Number.isFinite)) return null
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Единственное место, которое планирует системные напоминания из расписания. */
export const scheduleAllNotificationsFromSchedule = async (shifts: Map<string, Shift>) => {
  if (!Capacitor.isNativePlatform() || syncInProgress) return
  syncInProgress = true
  try {
    await ensureNotificationChannel()
    const { display } = await LocalNotifications.checkPermissions()
    if (display !== "granted") return

    // Полная синхронизация убирает старые ID/время и предотвращает накопление дублей.
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(({ id }) => ({ id })),
      })
    }

    const now = new Date()
    const notifications: LocalNotificationSchema[] = []
    const usedIds = new Set<number>()

    for (const [dateKey, shift] of shifts) {
      for (const notification of shift.notifications ?? []) {
        const id = Number(notification.id)
        const at = toLocalDate(dateKey, notification.time)
        if (!Number.isSafeInteger(id) || id < 0 || !at || at <= now || usedIds.has(id)) continue
        usedIds.add(id)
        notifications.push({
          id,
          title: "Напоминание",
          body: notification.message || "У вас есть напоминание!",
          smallIcon: "ic_notification_calendar",
          channelId: NOTIFICATION_CHANNEL_ID,
          schedule: { at, allowWhileIdle: true },
        })
      }
    }

    // Android ограничивает количество ожидающих локальных уведомлений; отправляем пакетом.
    if (notifications.length) {
      await LocalNotifications.schedule({ notifications })
    }
  } catch (error) {
    console.error("Ошибка синхронизации уведомлений:", error)
  } finally {
    syncInProgress = false
  }
}

/** Локальная дата, без преобразования в UTC. */
export const checkNotifications = (shifts: Map<string, Shift>, currentTime: Date) => {
  const year = currentTime.getFullYear()
  const month = String(currentTime.getMonth() + 1).padStart(2, "0")
  const day = String(currentTime.getDate()).padStart(2, "0")
  const currentDateKey = `${year}-${month}-${day}`
  const shift = shifts.get(currentDateKey)
  if (!shift?.notifications) return []
  return shift.notifications.filter((notification) => {
    const [hours, minutes] = notification.time.split(":").map(Number)
    return currentTime.getHours() === hours && currentTime.getMinutes() === minutes
  })
}

/** Совместимость со старым API. Для новых напоминаний используйте синхронизацию расписания. */
export const scheduleNotification = async (
  title: string,
  bodyOrOptions?: string | NotificationOptions,
  notificationId?: string,
  date?: Date,
) => {
  if (!Capacitor.isNativePlatform()) return
  try {
    await ensureNotificationChannel()
    const id = Number(notificationId || Date.now())
    if (!Number.isSafeInteger(id)) throw new Error("Некорректный ID уведомления")
    const body = typeof bodyOrOptions === "string"
      ? bodyOrOptions
      : bodyOrOptions?.body || "У вас есть напоминание!"
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title,
        body,
        smallIcon: "ic_notification_calendar",
        channelId: NOTIFICATION_CHANNEL_ID,
        schedule: { at: date || new Date(), allowWhileIdle: true },
      }],
    })
  } catch (error) {
    console.error("Ошибка планирования уведомления:", error)
  }
}


/** Совместимость со старым импортом из shift-details-panel.tsx.
 * Для новых напоминаний предпочтительна синхронизация через scheduleAllNotificationsFromSchedule.
 */
export const scheduleLocalNotification = async (
  notificationId: string,
  title: string,
  body: string,
  date: Date,
) => scheduleNotification(title, body, notificationId, date)
