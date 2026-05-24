"use client"

import { useEffect } from "react"
import type { ScheduleData } from "@/lib/types"
import { checkNotifications, scheduleNotification } from "@/lib/notification-utils"

/**
 * Подписывается на scheduleData и каждую минуту проверяет уведомления по текущим сменам.
 */
export function useScheduleNotifications(scheduleData: ScheduleData | null): void {
  useEffect(() => {
    if (!scheduleData) return

    const checkAndScheduleNotifications = () => {
      const now = new Date()
      const notificationsToShow = checkNotifications(scheduleData.shifts, now)
      notificationsToShow.forEach((notification) => {
        scheduleNotification(`Уведомление на ${notification.time}`, {
          body: notification.message || "У вас есть напоминание!",
        })
      })
    }

    checkAndScheduleNotifications()
    const intervalId = setInterval(checkAndScheduleNotifications, 60000)
    return () => clearInterval(intervalId)
  }, [scheduleData])
}
