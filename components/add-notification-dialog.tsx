"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AddNotificationDialogProps {
  onAddNotification: (time: string, message: string) => void
}

export function AddNotificationDialog({ onAddNotification }: AddNotificationDialogProps) {
  const [time, setTime] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = () => {
    if (time && message) {
      onAddNotification(time, message)
      alert("Уведомление добавлено")
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Добавить уведомление</DialogTitle>
      </DialogHeader>
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