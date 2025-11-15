"use client"

import type { Shift } from "@/lib/types"
import { MessageCircle, Clock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShiftDetailsPanelProps {
  shift: Shift | null
  date: Date | null
  onEdit: () => void
  onDelete: () => void
}

export function ShiftDetailsPanel({ shift, date, onEdit, onDelete }: ShiftDetailsPanelProps) {
  if (!shift || !date) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border text-center text-muted-foreground">
        <p>Выберите день для подробностей          </p>
      </div>
    )
  }

  const dateDisplay = date.toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const shiftLabels: Record<string, string> = {
    day: "Дневная",
    night: "Ночная",
    off: "Выходной",
    offn:"Отсыпной",
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border space-y-4">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
        <h3 className="text-lg font-semibold text-foreground">{dateDisplay}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Тип смены</p>
          <p className="font-semibold text-foreground">{shiftLabels[shift.type]}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Часы
          </p>
          <p className="font-semibold text-foreground">{shift.hours}h</p>
        </div>
      </div>

      {shift.notes && (
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            Notes
          </p>
          <p className="text-sm text-foreground break-words">{shift.notes}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={onEdit} className="flex-1">
          Редактировать
        </Button>
        <Button variant="destructive" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
