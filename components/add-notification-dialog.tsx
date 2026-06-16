"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Event } from "@mui/icons-material"
import { Capacitor } from "@capacitor/core"
import { LocalNotifications } from '@capacitor/local-notifications'
import { toast } from "sonner"

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
    const requestPermission = async () => {
      setIsRequestingPermission(true)
      try {
        await LocalNotifications.createChannel({
          id: 'reminders_channel',
          name: 'Напоминания',
          importance: 4,
          visibility: 1,
          sound: 'default',
          lights: true,
          vibration: true
        })

        const { display } = await LocalNotifications.checkPermissions()
        if (display === 'denied') {
          setPermissionDenied(true)
          return
        }
        if (display !== 'granted') {
          await LocalNotifications.requestPermissions()
          const { display: newStatus } = await LocalNotifications.checkPermissions()
          if (newStatus === 'denied') {
            setPermissionDenied(true)
          }
        }
      } catch (error) {
        console.error('Error setting up notifications:', error)
      } finally {
        setIsRequestingPermission(false)
      }
    }

    if (Capacitor.isNativePlatform()) {
      requestPermission()
    }
  }, [])

  const handleSubmit = async () => {
    if (!time || !message) return
    if (permissionDenied) {
      onAddNotification(time, message)
      toast.success("Уведомление сохранено")
      return
    }

    try {
      const [years, months, days] = date.split('-').map(Number)
      const [hours, minutes] = time.split(':').map(Number)
      
      const notificationTime = new Date(years, months - 1, days, hours, minutes, 0)
      
      const now = new Date()
      if (notificationTime <= now) {
        const tomorrow = new Date(notificationTime)
        tomorrow.setDate(tomorrow.getDate() + 1)
        notificationTime.setTime(tomorrow.getTime())
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: "Напоминание",
            body: message,
            smallIcon: "ic_notification_calendar",
            schedule: {
              at: notificationTime,
              allowWhileIdle: true,
            },
          },
        ],
      })

      onAddNotification(time, message)
      toast.success("Уведомление сохранено")
    } catch (error) {
      console.error('Error scheduling notification:', error)
      alert("Ошибка при добавлении уведомления")
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Добавить уведомление</DialogTitle>
      </DialogHeader>
      {isRequestingPermission && (
        <div className="flex justify-center py-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-sm text-gray-500">Запрос разрешения...</span>
        </div>
      )}
      {permissionDenied && (
        <div className="p-2 mb-2 text-sm text-yellow-700 bg-yellow-50 rounded">
          Разрешение на уведомления отклонено. Некоторые функции будут ограничены.
        </div>
      )}
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="time">Время</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
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