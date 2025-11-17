"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Shift } from "@/lib/types"
import { Bell, Trash2 } from "lucide-react"

interface ShiftDetailsPanelProps {
  shift: Shift | null
  date: string | null
  formattedDate: string | null
  onEdit: () => void
  onDelete: () => void
  onNoteUpdate: (date: string, note: string) => void
  onNotificationDelete: (date: string, notificationId: string) => void
}

export function ShiftDetailsPanel({
  shift,
  date,
  formattedDate,
  onEdit,
  onDelete,
  onNoteUpdate,
  onNotificationDelete
}: ShiftDetailsPanelProps) {
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [currentNote, setCurrentNote] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Инициализация заметки при изменении смены
  useEffect(() => {
    setCurrentNote(shift?.notes || "")
    setIsEditingNote(false)
  }, [shift, date])

  // Автоматически фокусироваться на textarea при начале редактирования
  useEffect(() => {
    if (isEditingNote && textareaRef.current) {
      textareaRef.current.focus()
      // Поместить курсор в конец текста
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }, [isEditingNote])

  const handleNoteClick = () => {
    if (shift) {
      setIsEditingNote(true)
    }
  }

  const handleNoteSave = () => {
    if (date && currentNote.trim() !== (shift?.notes || "")) {
      onNoteUpdate(date, currentNote.trim())
    }
    setIsEditingNote(false)
  }

  const handleNoteCancel = () => {
    setCurrentNote(shift?.notes || "")
    setIsEditingNote(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleNoteSave()
    } else if (e.key === "Escape") {
      handleNoteCancel()
    }
  }

  // Функция удаления уведомления (точно такая же как в ShiftEditor)
  const handleRemoveNotification = (id: string) => {
    if (date && onNotificationDelete) {
      onNotificationDelete(date, id)
    }
  }

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
            <span className="text-sm font-medium text-foreground">Отработано времени: </span>
            <span className="text-sm text-muted-foreground">
              {shift.hours || 0}ч {shift.minutes && shift.minutes > 0 ? `${shift.minutes}м` : ''}
            </span>
          </div>

          {/* Блок уведомлений */}
          {shift.notifications && shift.notifications.length > 0 && (
            <div>
              <span className="text-sm font-medium text-foreground">Уведомления: </span>
              <div className="mt-2 space-y-2">
                {shift.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start justify-between gap-2 bg-muted rounded-md p-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Bell className="h-3 w-3 text-accent flex-shrink-0" />
                        <span className="text-xs font-medium text-accent">{notification.time}</span>
                      </div>
                      {notification.message && (
                        <div className="text-xs text-muted-foreground break-words mt-1">{notification.message}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveNotification(notification.id)}
                      className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Блок заметки с возможностью редактирования по клику */}
          <div>
            <span className="text-sm font-medium text-foreground">Запись: </span>
            {isEditingNote ? (
              <div className="mt-2">
                <Textarea
                  ref={textareaRef}
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleNoteSave}
                  placeholder="Добавьте запись к дню..."
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Нажмите Ctrl+Enter для сохранения</span>
                  <span>Escape для отмены</span>
                </div>
              </div>
            ) : (
              <div
                onClick={handleNoteClick}
                className="mt-1 cursor-pointer"
              >
                {shift.notes ? (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 whitespace-pre-wrap">
                    {shift.notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-muted/30 rounded-md p-3 border border-dashed border-border">
                    Кликните, чтобы добавить запись...
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onEdit} className="flex-1">
              Редактировать смену
            </Button>
            <Button variant="destructive" onClick={onDelete} className="flex-1">
              Удалить смену
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