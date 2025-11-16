"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Shift, ShiftType, Notification } from "@/lib/types"
import { X, Plus, Trash2 } from "lucide-react"

interface ShiftEditorProps {
  date: string
  shift: Shift | null
  onSave: (shift: Shift) => void
  onClose: () => void
  formattedDate: string // Добавляем пропс с отформатированной датой
}

export function ShiftEditor({ date, shift, onSave, onClose, formattedDate }: ShiftEditorProps) {
  const [shiftType, setShiftType] = useState<ShiftType>(shift?.type || "day")
  const [hours, setHours] = useState(shift?.hours || 12)
  const [hoursInput, setHoursInput] = useState(String(shift?.hours || 12))
  const [notes, setNotes] = useState(shift?.notes || "")
  const [notifications, setNotifications] = useState<Notification[]>(shift?.notifications || [])
  const [showNotificationForm, setShowNotificationForm] = useState(false)
  const [newNotifTime, setNewNotifTime] = useState("09:00")

  const handleSave = () => {
    onSave({
      date,
      type: shiftType,
      hours,
      notes,
      notifications: notifications.length > 0 ? notifications : undefined,
    })
    onClose()
  }

  const handleAddNotification = () => {
    if (!notes.trim()) return

    const newNotif: Notification = {
      id: Date.now().toString(),
      time: newNotifTime,
      message: notes,
      createdAt: new Date().toISOString(),
    }

    setNotifications([...notifications, newNotif])
    setNewNotifTime("09:00")
    setShowNotificationForm(false)
  }

  const handleRemoveNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const shiftTypeHours: Record<ShiftType, number> = {
    day: 12,
    night: 12,
    off: 0,
    offn: 8,
  }

  const handleShiftTypeChange = (type: ShiftType) => {
    setShiftType(type)
    const newHours = shiftTypeHours[type]
    setHours(newHours)
    setHoursInput(newHours === 0 ? "" : String(newHours))
  }

  const handleHoursFocus = () => {
    if (hours === 0) {
      setHoursInput("")
    }
  }

  const handleHoursBlur = () => {
    if (hoursInput === "") {
      setHours(0)
      setHoursInput("0")
    } else {
      const newHours = Number(hoursInput)
      setHours(newHours)
    }
  }

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setHoursInput(value)

    if (value !== "") {
      setHours(Number(value))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 border border-border max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Редактирование графика</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Используем готовый formattedDate вместо dateDisplay */}
        <p className="text-sm text-muted-foreground mb-4">{formattedDate}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2"></label>
            <div className="grid grid-cols-3 gap-2">
              {(["day", "night", "off"] as ShiftType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleShiftTypeChange(type)}
                  className={`py-2 px-3 rounded-md font-medium transition-all ${
                    shiftType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-input border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Отработано часов</label>
            <input
              type="number"
              min="0"
              max="24"
              value={hoursInput}
              onChange={handleHoursChange}
              onFocus={handleHoursFocus}
              onBlur={handleHoursBlur}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Запись</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Добавить запись к дню"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground resize-none text-sm"
              rows={3}
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-foreground">Напоминание</label>
              {!showNotificationForm && (
                <button
                  onClick={() => setShowNotificationForm(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <Plus className="h-3 w-3" />
                  Добавить
                </button>
              )}
            </div>

            {showNotificationForm && (
              <div className="bg-muted rounded-md p-3 mb-3 space-y-2">
                <input
                  type="time"
                  value={newNotifTime}
                  onChange={(e) => setNewNotifTime(e.target.value)}
                  className="w-full px-2 py-1 bg-input border border-border rounded text-foreground text-sm"
                />
                <p className="text-xs text-muted-foreground">Напоминание не может быть выставлено с пустым полем</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNotificationForm(false)}
                    className="flex-1 px-2 py-1 text-xs bg-muted border border-border rounded hover:bg-muted/80"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAddNotification}
                    className="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            )}

            {notifications.length > 0 && (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start justify-between gap-2 bg-muted rounded-md p-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-accent">{notif.time}</div>
                      <div className="text-xs text-muted-foreground break-words">{notif.message}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveNotification(notif.id)}
                      className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Отмена
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Сохранить
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}