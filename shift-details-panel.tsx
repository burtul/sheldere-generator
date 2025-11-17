"use client"

import { Button } from "@/components/ui/button"
import type { Shift } from "@/lib/types"
import { Bell } from "lucide-react"

interface ShiftDetailsPanelProps {
  shift: Shift | null
  date: string | null
  formattedDate: string | null
  onEdit: () => void
  onDelete: () => void
}

export function ShiftDetailsPanel({
  shift,
  date,
  formattedDate,
  onEdit,
  onDelete
}: ShiftDetailsPanelProps) {
  // Если дата не выбрана, показываем сообщение
  if (!date) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Информация о смене</h3>
        <p className="text-muted-foreground">Выберите дату в календаре</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Информация о смене</h3>

      {/* Используем formattedDate вместо date.toLocaleDateString() */}
      <p className="text-sm text-muted-foreground mb-4">{formattedDate}</p>

      {shift ? (
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-foreground">Тип смены: </span>
            <span className="text-sm text-muted-foreground capitalize">{shift.type}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">Отработано часов: </span>
            <span className="text-sm text-muted-foreground">{shift.hours}</span>
          </div>

          {/* Блок уведомлений */}
          {shift.notifications && shift.notifications.length > 0 && (
            <div>
              <span className="text-sm font-medium text-foreground">Уведомления: </span>
              <div className="mt-2 space-y-2">
                {shift.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-2"
                  >
                    <Bell className="h-3 w-3 text-accent" />
                    <span>{notification.time}</span>
                    {notification.message && (
                      <span className="text-xs opacity-75">- {notification.message}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {shift.notes && (
            <div>
              <span className="text-sm font-medium text-foreground">Запись: </span>
              <span className="text-sm text-muted-foreground">{shift.notes}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onEdit} className="flex-1">
              Редактировать
            </Button>
            <Button variant="destructive" onClick={onDelete} className="flex-1">
              Удалить
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground">На выбранную дату смена не запланирована</p>
          <Button onClick={onEdit} className="w-full">
            Добавить смену
          </Button>
        </div>
      )}
    </div>
  )
}