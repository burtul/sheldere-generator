"use client"

import { useEffect } from "react"
import type { ScheduleData } from "@/lib/types"
import { scheduleAllNotificationsFromSchedule } from "@/lib/notification-utils"

/**
 * Подписывается на scheduleData и запланирует все уведомления из расписания.
 * Использует allowWhileIdle для работы на выключенном экране.
 */
export function useScheduleNotifications(scheduleData: ScheduleData | null): void {
  useEffect(() => {
    if (!scheduleData) return
    scheduleAllNotificationsFromSchedule(scheduleData.shifts)
  }, [scheduleData])
}
