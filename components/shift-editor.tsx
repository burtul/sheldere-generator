"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { Shift, ShiftType, Notification } from "@/lib/types"
import { X, Plus, Trash2 } from "lucide-react"

interface ShiftEditorProps {
  date: string
  shift: Shift | null
  onSave: (shift: Shift) => void
  onClose: () => void
  formattedDate: string
}

export function ShiftEditor({ date, shift, onSave, onClose, formattedDate }: ShiftEditorProps) {
  const [shiftType, setShiftType] = useState<ShiftType>(shift?.type || "day")
  const [hours, setHours] = useState(shift?.hours || 0)
  const [minutes, setMinutes] = useState(shift?.minutes || 0)
  const [hoursInput, setHoursInput] = useState(shift?.hours ? String(shift.hours) : "")
  const [minutesInput, setMinutesInput] = useState(shift?.minutes ? String(shift.minutes) : "")
  const [notes, setNotes] = useState(shift?.notes || "")
  const [notifications, setNotifications] = useState<Notification[]>(shift?.notifications || [])
  const [showNotificationForm, setShowNotificationForm] = useState(false)
  const [newNotifTime, setNewNotifTime] = useState("09:00")

  const modalRef = useRef<HTMLDivElement>(null)

  // Обработчик клика вне модального окна
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Обработчик Escape клавиши
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  // Автоматически сбрасывать минуты при 24 часах
  useEffect(() => {
    if (hours === 24 && minutes > 0) {
      setMinutes(0)
      setMinutesInput("0")
    }
  }, [hours, minutes])

  const handleSave = () => {
    // Финализируем проверку перед сохранением
    const finalMinutes = hours === 24 ? 0 : minutes

    onSave({
      date,
      type: shiftType,
      hours,
      minutes: finalMinutes,
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

  const shiftTypeHours: Record<ShiftType, { hours: number; minutes: number }> = {
    day: { hours: 12, minutes: 0 },
    night: { hours: 12, minutes: 0 },
    off: { hours: 0, minutes: 0 },
    offn: { hours: 8, minutes: 0 },
  }

  const handleShiftTypeChange = (type: ShiftType) => {
    setShiftType(type)
    const newTime = shiftTypeHours[type]
    setHours(newTime.hours)
    setMinutes(newTime.minutes)
    setHoursInput(newTime.hours === 0 ? "" : String(newTime.hours))
    setMinutesInput(newTime.minutes === 0 ? "" : String(newTime.minutes))
  }

  const handleHoursFocus = () => {
    if (hoursInput === "0") {
      setHoursInput("")
    }
  }

  const handleHoursBlur = () => {
    if (hoursInput === "") {
      setHours(0)
      setHoursInput("0")
    } else {
      const newHours = Math.min(24, Math.max(0, Number(hoursInput)))
      setHours(newHours)
      setHoursInput(String(newHours))

      // Сброс минут при 24 часах
      if (newHours === 24) {
        setMinutes(0)
        setMinutesInput("0")
      }
    }
  }

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Разрешаем только цифры и пустую строку
    if (value === "" || /^\d+$/.test(value)) {
      setHoursInput(value)
    }
  }

  const handleMinutesFocus = () => {
    if (minutesInput === "0") {
      setMinutesInput("")
    }
  }

  const handleMinutesBlur = () => {
    if (minutesInput === "") {
      setMinutes(0)
      setMinutesInput("0")
    } else {
      const newMinutes = Math.min(59, Math.max(0, Number(minutesInput)))
      setMinutes(newMinutes)
      setMinutesInput(String(newMinutes))
    }
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Разрешаем только цифры и пустую строку
    if (value === "" || /^\d+$/.test(value)) {
      // Блокируем ввод минут при 24 часах
      if (hours !== 24) {
        setMinutesInput(value)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-card rounded-lg p-6 border border-border max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Редактирование графика</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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
            <label className="block text-sm font-medium text-foreground mb-2">Отработано времени</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Часы (макс. 24)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={hoursInput}
                  onChange={handleHoursChange}
                  onFocus={handleHoursFocus}
                  onBlur={handleHoursBlur}
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Минуты (макс. 59)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={minutesInput}
                  onChange={handleMinutesChange}
                  onFocus={handleMinutesFocus}
                  onBlur={handleMinutesBlur}
                  disabled={hours === 24}
                  className={`w-full px-3 py-2 bg-input border border-border rounded-md text-foreground ${
                    hours === 24 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="0"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Итого: {hours}ч {minutes > 0 && `${minutes}м`}
              {hours === 24 && " (минуты не учитываются при 24 часах)"}
            </p>
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