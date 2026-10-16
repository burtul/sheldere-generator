import type { Shift } from "./types"
import { LocalNotifications } from '@capacitor/local-notifications'

let isChannelCreated = false

export const ensureNotificationChannel = async () => {
  if (isChannelCreated) return
  try {
      await LocalNotifications.createChannel({
        id: 'reminders_channel',
        name: 'Напоминания',
        importance: 4,
        visibility: 1,
        sound: 'file://android.resource://com.burt.app/raw/alarm',
        lights: true // Дополнительная настройка вибрации
      })
    isChannelCreated = true
  } catch (error) {
    console.error('Error creating notification channel:', error)
  }
}

export const cancelNotification = async (notificationId: string) => {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: parseInt(notificationId) }] })
  } catch (error) {
    console.error('Error canceling notification:', error)
  }
}

export const cancelAllNotifications = async () => {
  try {
    await LocalNotifications.cancel({ notifications: [] })
  } catch (error) {
    console.error('Error canceling all notifications:', error)
  }
}

export const scheduleLocalNotification = async (notificationId: string, title: string, body: string, date: Date) => {
  try {
    await ensureNotificationChannel()
await LocalNotifications.schedule({
        notifications: [{
          id: parseInt(notificationId),
          title,
          body,
          smallIcon: 'ic_notification_calendar',
          sound: 'file://android.resource://com.burt.app/raw/alarm',
          vibrate: [0, 1000, 500, 1000],
          priority: 'high',
          schedule: {
at: date,
            allowWhileIdle: true,
          },
        }]
      })
  } catch (error) {
    console.error('Error scheduling notification:', error)
  }
}

export const scheduleAllNotificationsFromSchedule = async (shifts: Map<string, Shift>) => {
  try {
    await ensureNotificationChannel()
    
    const pending = await LocalNotifications.getPending()
    const scheduledIds = new Set(pending.notifications.map(n => n.id))
    
    for (const [dateKey, shift] of shifts) {
      if (!shift.notifications) continue
      
      const [year, month, day] = dateKey.split('-').map(Number)
      
      for (const notification of shift.notifications) {
        const notificationId = parseInt(notification.id)
        const [hours, minutes] = notification.time.split(':').map(Number)
        const notificationDate = new Date(year, month - 1, day, hours, minutes, 0)
        
        const now = new Date()
        if (notificationDate > now && !scheduledIds.has(notificationId)) {
await LocalNotifications.schedule({
              notifications: [{
                id: notificationId,
                title: "Напоминание",
                body: notification.message || "У вас есть напоминание!",
                smallIcon: 'ic_notification_calendar',
                sound: 'file://android.resource://com.burt.app/raw/alarm',
                vibrate: [0, 1000, 500, 1000],
                priority: 'high',
                schedule: {
                  at: notificationDate,
                  allowWhileIdle: true,
                },
              }]
            })
        }
      }
    }
  } catch (error) {
    console.error('Error scheduling all notifications:', error)
  }
}

/**
 * Ищет уведомления, которые должны сработать ровно в текущую минуту.
 * Дата берётся в формате YYYY-MM-DD, чтобы совпасть с ключами карты смен.
 */
export const checkNotifications = (shifts: Map<string, Shift>, currentTime: Date) => {
  const now = currentTime
  const currentDateKey = now.toISOString().split('T')[0]

  const shift = shifts.get(currentDateKey)
  if (shift && shift.notifications) {
    return shift.notifications.filter(notification => {
      const [hours, minutes] = notification.time.split(':').map(Number)
      return now.getHours() === hours && now.getMinutes() === minutes
    })
  }
  return []
}

/**
 * Показывает нативное уведомление через Capacitor LocalNotifications.
 * Используется для уведомлений, которые должны работать на выключенном экране.
 */
export const scheduleNotification = async (title: string, bodyOrOptions?: string | NotificationOptions, notificationId?: string, date?: Date) => {
  try {
    await ensureNotificationChannel()
    const now = date || new Date()
    const body = typeof bodyOrOptions === 'string' 
      ? bodyOrOptions 
      : bodyOrOptions?.body || "У вас есть напоминание!"
    await LocalNotifications.schedule({
      notifications: [{
        id: parseInt(notificationId || Date.now().toString()),
        title,
        body,
        smallIcon: 'ic_notification_calendar',
        schedule: {
          at: now,
          allowWhileIdle: true,
        },
      }]
    })
  } catch (error) {
    console.error('Error showing notification:', error)
  }
}
