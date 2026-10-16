"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Event } from "@mui/icons-material"
import { Capacitor } from "@capacitor/core"
import { LocalNotifications } from "@capacitor/local-notifications"
import { toast } from "sonner"
import { ensureNotificationChannel } from "@/lib/notification-utils"

interface AddNotificationDialogProps {
  date: string
  onAddNotification: (time: string, message: string) => void
}

export function AddNotificationDialog({ date, onAddNotification }: AddNotificationDialogProps) {
  const [time, setTime] = useState("")
  const [message, setMessage] = useState("")
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let cancelled = false
    const setup = async () => {
      setIsRequestingPermission(true)
      try {
        await ensureNotificationChannel()
        const { display } = await LocalNotifications.checkPermissions()
        if (!cancelled) setPermissionDenied(display !== "granted")
      } catch (error) {
        console.error("Ошибка настройки разрешений уведомлений:", error)
        if (!cancelled) setPermissionDenied(true)
      } finally {
        if (!cancelled) setIsRequestingPermission(false)
      }
    }
    void setup()
    return () => { cancelled = true }
  }, [])

  const handleSubmit = () => {
    if (!time || !message.trim()) {
      toast.error("Укажи время и текст напоминания")
      return
    }
    // Не планируем уведомление здесь: родитель сохраняет его в расписании,
    // а scheduleAllNotificationsFromSchedule синхронизирует системные уведомления.
    onAddNotification(time, message.trim())
    toast.success("Напоминание сохранено")
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Добавить уведомление</DialogTitle>
      </DialogHeader>
      {isRequestingPermission && (
        <div className="flex justify-center py-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="ml-2 text-sm text-gray-500">Проверка разрешения…</span>
        </div>
      )}
      {permissionDenied && Capacitor.isNativePlatform() && (
        <div className="p-2 mb-2 text-sm text-yellow-700 bg-yellow-50 rounded">
          Разрешение на уведомления не выдано. Напоминание сохранится в расписании, но Android может его не показать.
        </div>
      )}
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="time">Время</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Сообщение</Label>
          <Input
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Например, 'Напоминание о встрече'"
          />
        </div>
        <Button onClick={handleSubmit} className="w-full">
          <Event className="size-4" />
          Сохранить уведомление
        </Button>
      </div>
    </>
  )
}
