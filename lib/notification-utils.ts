import type { Shift } from "./types"

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
 * Показывает браузерное уведомление или запрашивает разрешение,
 * если пользователь ещё не сделал выбор.
 */
export const scheduleNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options)
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, options)
      }
    })
  }
}
