"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LocalNotifications } from '@capacitor/local-notifications'

interface AddNotificationDialogProps {
  onAddNotification: (time: string, message: string) => void
}

export function AddNotificationDialog({ onAddNotification }: AddNotificationDialogProps) {
  const [time, setTime] = useState("")
  const [message, setMessage] = useState("")

  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    // Запрашиваем разрешение на уведомления с явным указанием канала
    const requestPermission = async () => {
      setIsRequestingPermission(true)
      try {
        // Создаём канал уведомлений (обязательно для Android 8+)
        await LocalNotifications.createChannel({
          id: 'reminders_channel',
          name: 'Напоминания',
          importance: 4, // HIGH
          visibility: 1,  // PUBLIC
          sound: 'default',
          lights: true,
          vibration: true
        })

        // Проверяем и запрашиваем разрешение
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

    requestPermission()
  }, [])

  const handleSubmit = async () => {
    if (!time || !message) return
    if (permissionDenied) {
      alert('Разрешение на уведомления отклонено. Функция будет ограничена.')
      return
    }

    try {
      // Планируем локальное уведомление
      const notificationTime = new Date()
      const [hours, minutes] = time.split(':').map(Number)
      notificationTime.setHours(hours, minutes, 0)

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: "Напоминание",
            body: message,
            schedule: {
              at: notificationTime,
              allowWhileIdle: true,
            },
          },
        ],
      })

      onAddNotification(time, message)
      alert("Уведомление запланировано")
    } catch (error) {
      console.error('Error scheduling notification:', error)
      alert("Ошибка при планировании уведомления")
    }
  }

  return (
    <DialogContent>
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
          Сохранить уведомление
        </Button>
      </div>
    </DialogContent>
  )
}