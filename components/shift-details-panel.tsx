 "use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddNotificationDialog } from "./add-notification-dialog"
import type { Shift } from "@/lib/types"
import { Bell, Trash2, AlertCircle, Plus } from "lucide-react"
import { loadTeamShifts, saveTeamShifts } from '@/lib/storage';

 interface ShiftDetailsPanelProps {
  shift: Shift | null
  date: string | null
  formattedDate: string | null
  onEdit: () => void
  onDelete: () => void
  onNoteUpdate: (date: string, note: string) => void
  onNotificationDelete: (date: string, notificationId: string) => void
  onNoteDelete: (date: string) => void
  scheduleData: any
  setScheduleData: (data: any) => void
  currentTeamId?: string
}

 export function ShiftDetailsPanel({
  shift,
  date,
  formattedDate,
  onEdit,
  onDelete,
  onNoteUpdate,
  onNotificationDelete,
  onNoteDelete,
  scheduleData,
  setScheduleData,
  currentTeamId
}: ShiftDetailsPanelProps) {
   const [isEditingNote, setIsEditingNote] = useState(false)
   const [currentNote, setCurrentNote] = useState("")
   const [showDeleteAlert, setShowDeleteAlert] = useState(false)
   const textareaRef = useRef<HTMLTextAreaElement>(null)

   // Функция для преобразования типа смены в название
   const getShiftTypeName = (type: string) => {
     switch (type) {
       case "day":
         return "Дневная"
       case "night":
         return "Ночная1"
         case "night2":
         return "Ночная2"
       case "off":
         return "Выходной"
       case "offn":
         return "Отсыпной"
       case "weekday":
         return "Рабочий8"
       case "weekday15":
         return "Рабочий8-15"
         case "weekday7":
         return "Рабочий7"
       default:
         return type
     }
   }

   // Инициализация заметки при изменении смены
   useEffect(() => {
     setCurrentNote(shift?.notes || "")
     setIsEditingNote(false)
     setShowDeleteAlert(false)
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

    // Обработка добавления нового уведомления
    const handleAddNotification = (time: string, message: string) => {
      if (!date || !scheduleData || !setScheduleData) return;

      const newNotification = {
        id: Date.now().toString(),
        time,
        message,
      };

      const newShifts = new Map(scheduleData.shifts);
      const shift = newShifts.get(date);

      if (shift) {
        const updatedNotifications = (shift as any).notifications ? [...(shift as any).notifications, newNotification] : [newNotification];
        newShifts.set(date, {
          ...shift,
          notifications: updatedNotifications,
        });

        setScheduleData({
          ...scheduleData,
          shifts: newShifts,
        });
      }
    };

   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
       handleNoteSave()
     } else if (e.key === "Escape") {
       handleNoteCancel()
     }
   }

   // Функция удаления уведомления (как в ShiftEditor)
   const handleRemoveNotification = (id: string) => {
     if (date && onNotificationDelete) {
       onNotificationDelete(date, id)
     }
   }

    // Функция удаления заметки
    const handleRemoveNote = () => {
      // Проверяем, есть ли уведомления, связанные с этой заметкой
      const hasNotifications = shift?.notifications && shift.notifications.length > 0

      if (hasNotifications) {
        setShowDeleteAlert(true)
      } else if (date && onNoteDelete) {
        onNoteDelete(date)
      }
    }

    // Функция подтверждения удаления (даже с уведомлениями)
    const handleConfirmNoteDelete = () => {
      if (date && onNoteDelete) {
        onNoteDelete(date)
      }
      setShowDeleteAlert(false)
    }

    // Обработчик удаления смены с сохранением изменений для команды
    const handleDeleteShift = () => {
      try {
        // Обновляем данные в хранилище команды, если указан teamId
        if (currentTeamId && date) {
          const existingTeamShifts = loadTeamShifts(currentTeamId) || new Map<string, Shift>();
          existingTeamShifts.set(date, {
            date,
            type: 'off',
            hours: 0,
            minutes: 0
          });
          saveTeamShifts(currentTeamId, existingTeamShifts);
        }

        // Всегда выполняем оригинальную функцию удаления
        onDelete();
      } catch (error) {
        console.error("Failed to update team shifts:", error);
        // Даже при ошибке выполняем удаление
        onDelete();
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

   // Проверяем, есть ли уведомления, связанные с заметкой
   const hasNotifications = shift?.notifications && shift.notifications.length > 0

   return (
     <div className="bg-card rounded-lg p-6 border border-border">
       <h3 className="text-lg font-semibold text-foreground mb-4">Информация о смене</h3>

       {/* Используем formattedDate вместо date.toLocaleDateString() */}
       <p className="text-sm text-muted-foreground mb-4">{formattedDate}</p>

       {shift ? (
         <div className="space-y-4">
           <div className="bg-muted/50 rounded-lg p-3">
             <div className="flex justify-between items-center text-base mb-1">
               <span className="text-muted-foreground">Тип смены</span>
             </div>
             <div className="flex justify-between items-center text-xl font-bold">
               <span className="text-foreground text-center flex-1">{getShiftTypeName(shift.type)}</span>
             </div>
           </div>

           <div className="bg-muted/50 rounded-lg p-3">
             <div className="flex justify-between items-center text-base mb-1">
               <span className="text-muted-foreground">Отработано времени</span>
             </div>
             <div className="flex justify-between items-center text-xl font-bold">
               <span className="text-foreground text-center flex-1">
                 {shift.hours || 0}ч {shift.minutes && shift.minutes > 0 ? `${shift.minutes}м` : ''}
               </span>
             </div>
           </div>

            {/* Блок уведомлений */}
            {(shift as any).notifications && (shift as any).notifications.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex justify-between items-center text-base mb-1">
                  <span className="text-muted-foreground">Уведомления</span>
                </div>
                <div className="mt-2 space-y-2">
                  {(shift as any).notifications.map((notification: any) => (
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
            
            {/* Кнопка для добавления нового уведомления */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Добавить уведомление
                </Button>
              </DialogTrigger>
              <AddNotificationDialog onAddNotification={handleAddNotification} />
            </Dialog>

           {/* Блок заметки с возможностью редактирования по клику */}
           <div className="bg-muted/50 rounded-lg p-3">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm font-medium text-foreground">Запись</span>
               {shift.notes && !isEditingNote && (
                 <button
                   onClick={handleRemoveNote}
                   className={`flex-shrink-0 p-1 transition-colors ${
                     hasNotifications
                       ? "text-yellow-500 hover:text-yellow-600"
                       : "text-muted-foreground hover:text-destructive"
                   }`}
                   title={hasNotifications ? "Есть связанные уведомления" : "Удалить запись"}
                 >
                   {hasNotifications ? (
                     <AlertCircle className="h-3 w-3" />
                   ) : (
                     <Trash2 className="h-3 w-3" />
                   )}
                 </button>
               )}
             </div>
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

           {/* Предупреждение об удалении заметки с уведомлениями */}
           {showDeleteAlert && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
               <div className="flex items-start gap-3">
                 <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                 <div className="flex-1">
                   <h4 className="text-sm font-medium text-yellow-800 mb-1">
                     Внимание: есть связанные уведомления
                   </h4>
                   <p className="text-sm text-yellow-700 mb-3">
                     У этой записи есть уведомления. Если вы удалите запись, уведомления также будут удалены.
                   </p>
                   <div className="flex gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => setShowDeleteAlert(false)}
                       className="flex-1"
                     >
                       Отмена
                     </Button>
                     <Button
                       variant="destructive"
                       size="sm"
                       onClick={handleConfirmNoteDelete}
                       className="flex-1"
                     >
                       Удалить все
                     </Button>
                   </div>
                 </div>
               </div>
             </div>
           )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onEdit} className="flex-1">
                Редактировать смену
              </Button>
              <Button variant="destructive" onClick={handleDeleteShift} className="flex-1">
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