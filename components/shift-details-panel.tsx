"use client"

import { Button } from "@/components/ui/button"
import type { Shift } from "@/lib/types"

interface ShiftDetailsPanelProps {
  shift: Shift | null
  date: string | null
  formattedDate: string | null // добавлено для отображения
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