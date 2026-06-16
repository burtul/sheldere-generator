import React, { useState, useRef } from 'react';
import type { Shift, ShiftType } from '@/lib/types';
import { saveTeamShifts, loadTeamShifts } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { AddNotificationDialog } from './add-notification-dialog';
import { Bell, Trash2, Plus } from 'lucide-react';
import { cancelNotification, scheduleLocalNotification } from '@/lib/notification-utils';

interface ShiftEditorProps {
  date: string;
  shift: Shift | null;
  onSave: (shift: Shift) => void;
  onClose: () => void;
  formattedDate: string;
  scheduleType?: '2x2' | '5days';
  schedule5DayType?: '8hours' | '8-15';
  scheduleData: any;
  setScheduleData: (data: any) => void;
  currentTeamId?: string;
}

// Функция для получения доступных типов смен в зависимости от графика
function getAvailableShiftTypes(scheduleType?: '2x2' | '5days', schedule5DayType?: '8hours' | '8-15'): ShiftType[] {
  if (scheduleType === '5days') {
    // Для 5-дневного графика
    if (schedule5DayType === '8-15') {
      return ['weekday15', 'weekday7', 'off'];
    } else {
      return ['weekday', 'off'];
    }
  } else {
    // Для 2x2 графика (по умолчанию)
    return ['day', 'night', 'night2', 'offn', 'off'];
  }
}

export function ShiftEditor({
  date,
  shift,
  onSave,
  onClose,
  formattedDate,
  scheduleType = '2x2',
  schedule5DayType = '8hours',
  scheduleData,
  setScheduleData,
  currentTeamId,
}: ShiftEditorProps) {
  const [shiftData, setShiftData] = React.useState<Shift>(() =>
    shift || {
      date,
      type: 'day',
      hours: 0,
      minutes: 0,
      notes: '',
      notifications: [],
    }
  );
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Инициализация заметки при изменении смены
  React.useEffect(() => {
    setCurrentNote(shift?.notes || '');
    setIsEditingNote(false);
  }, [shift]);

  // Автоматически фокусироваться на textarea при начале редактирования
  React.useEffect(() => {
    if (isEditingNote && textareaRef.current) {
      textareaRef.current.focus();
      // Поместить курсор в конец текста
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditingNote]);

  // Получаем доступные типы смен для текущего графика
  const availableShiftTypes = getAvailableShiftTypes(scheduleType, scheduleType === '5days' ? schedule5DayType : undefined);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'hours') {
      const hoursValue = value.replace(/^0+/, '');
      const hours = Math.min(24, Math.max(0, parseInt(hoursValue) || 0));
      const minutes = hours === 24 ? 0 : shiftData.minutes;
      setShiftData((prev) => ({ ...prev, hours, minutes }));
      e.target.value = hours.toString();
    } else if (name === 'minutes') {
      const hours = shiftData.hours;
      const maxMinutes = hours === 24 ? 0 : 59;
      const minutesValue = value.replace(/^0+/, '');
      const minutes = Math.min(maxMinutes, Math.max(0, parseInt(minutesValue) || 0));
      setShiftData((prev) => ({ ...prev, minutes }));
      e.target.value = minutes.toString();
    } else if (name === 'type') {
      // Автоматическое подставление часов при выборе типа смены
      let hours = 0;
      let minutes = 0;
      switch (value) {
        case 'day':
          hours = 12;
          break;
        case 'night':
          hours = 4;
          break;
        case 'night2':
          hours = 12;
          break;
        case 'offn':
          hours = 8;
          break;
        case 'weekday':
          hours = 8;
          break;
        case 'weekday15':
          hours = 8;
          minutes = 15;
          break;
        case 'weekday7':
          hours = 7;
          break;
        default:
          hours = 0;
          minutes = 0;
      }
      setShiftData((prev) => ({ ...prev, type: value as Shift['type'], hours, minutes }));
    } else {
      setShiftData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    // Проверяем, что уведомления из shiftData передаются в глобальное состояние
    const updatedShift = {
      ...shiftData,
      notifications: shiftData.notifications || [],
    };

    // Обновляем глобальное состояние, если переданы scheduleData и setScheduleData
    if (scheduleData && setScheduleData && date) {
      const newShifts = new Map(scheduleData.shifts);
      newShifts.set(date, updatedShift);
      setScheduleData({
        ...scheduleData,
        shifts: newShifts,
      });

    // Сохраняем изменения Shift для текущей команды, если указан teamId
    if (currentTeamId) {
      try {
        const existingTeamShifts = loadTeamShifts(currentTeamId) || new Map<string, Shift>();
        existingTeamShifts.set(date, {
          ...updatedShift,
        // Сохраняем только тип смены, остальные данные берутся из основного графика
        type: updatedShift.type,
        hours: updatedShift.hours,
        minutes: updatedShift.minutes,
        });
        saveTeamShifts(currentTeamId, existingTeamShifts);
        console.log(`Сохранено для команды ${currentTeamId}:`, { date, shift: updatedShift });
      } catch (error) {
        console.error("Failed to save team shifts:", error);
      }
    }
    }

    onSave(updatedShift);
    onClose();
  };

  // Функция для получения названия типа смены
  const getShiftTypeName = (type: ShiftType) => {
    switch (type) {
      case 'day':
        return 'Дневная';
      case 'night':
        return 'Ночная1';
      case 'night2':
        return 'Ночная2';
      case 'off':
        return 'Выходной';
      case 'offn':
        return 'Отсыпной';
      case 'weekday':
        return 'Рабочий8';
      case 'weekday15':
        return 'Рабочий8-15';
      case 'weekday7':
        return 'Рабочий7';
      default:
        return type;
    }
  };

// Обработка добавления нового уведомления
   const handleAddNotification = (time: string, message: string) => {
     if (!date || !scheduleData || !setScheduleData) return;

     if (!time) {
       alert('Пожалуйста, укажите время для уведомления');
       return;
     }

     if (!message.trim()) {
       alert('Пожалуйста, добавьте текст сообщения');
       return;
     }

     const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
     if (!timeRegex.test(time)) {
       alert('Некорректный формат времени. Используйте формат ЧЧ:ММ');
       return;
     }

     const newNotification = {
       id: Date.now().toString(),
       time,
       message: message.trim(),
     };

// Планируем уведомление
      const [years, months, days] = date.split('-').map(Number)
      const [hours, minutes] = time.split(':').map(Number)
      const notificationDate = new Date(years, months - 1, days, hours, minutes, 0)
      const now = new Date()
      if (notificationDate > now) {
        scheduleLocalNotification(newNotification.id, "Напоминание", newNotification.message, notificationDate).catch(console.error)
      }

     // Обновляем локальное состояние смены
     setShiftData(prev => ({
       ...prev,
       notifications: [...(prev.notifications || []), newNotification],
     }));

     // Обновляем глобальное состояние
     const newShifts = new Map(scheduleData.shifts);
     const currentShift = newShifts.get(date);
     if (currentShift) {
       const updatedNotifications = (currentShift as any).notifications ? [...(currentShift as any).notifications, newNotification] : [newNotification];
       newShifts.set(date, {
         ...currentShift,
         notifications: updatedNotifications,
       });
       setScheduleData({
         ...scheduleData,
         shifts: newShifts,
       });
     }
   };

// Удаление уведомления
   const handleRemoveNotification = (id: string) => {
     if (!date || !scheduleData || !setScheduleData) return;

     // Отменяем запланированное уведомление
     cancelNotification(id).catch(err => console.error('Failed to cancel notification:', err))

     // Обновляем локальное состояние смены
     setShiftData(prev => ({
       ...prev,
       notifications: (prev.notifications || []).filter(n => n.id !== id),
     }));

     // Обновляем глобальное состояние
     const newShifts = new Map(scheduleData.shifts);
     const currentShift = newShifts.get(date);
     if (currentShift) {
       const updatedNotifications = (currentShift as any).notifications ? (currentShift as any).notifications.filter((n: any) => n.id !== id) : [];
       newShifts.set(date, {
         ...currentShift,
         notifications: updatedNotifications,
       });
       setScheduleData({
         ...scheduleData,
         shifts: newShifts,
       });
     }
   };

  const handleNoteClick = () => {
    setIsEditingNote(true);
  };

  const handleNoteSave = () => {
    if (currentNote.trim() !== (shift?.notes || '')) {
      setShiftData((prev) => ({ ...prev, notes: currentNote.trim() }));
    }
    setIsEditingNote(false);
  };

  const handleNoteCancel = () => {
    setCurrentNote(shift?.notes || '');
    setIsEditingNote(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleNoteSave();
    } else if (e.key === 'Escape') {
      handleNoteCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Редактировать смену</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground">Дата: {formattedDate}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Тип смены
            </label>
            <select
              name="type"
              value={shiftData.type}
              onChange={handleInputChange}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
            >
              {availableShiftTypes.map((type) => (
                <option key={type} value={type}>
                  {getShiftTypeName(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">
                Часы
              </label>
              <input
                type="number"
                name="hours"
                value={shiftData.hours}
                onChange={handleInputChange}
                min="0"
                max="24"
                className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            {shiftData.hours !== 24 && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Минуты
                </label>
                <input
                  type="number"
                  name="minutes"
                  value={shiftData.minutes}
                  onChange={handleInputChange}
                  min="0"
                  max="59"
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            )}
          </div>

          {/* Блок уведомлений */}
          {shiftData.notifications && shiftData.notifications.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between items-center text-base mb-1">
                <span className="text-muted-foreground">Уведомления</span>
              </div>
              <div className="mt-2 space-y-2">
                {shiftData.notifications.map((notification: any) => (
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
             <DialogContent onInteractOutside={(e) => e.preventDefault()}>
               <AddNotificationDialog date={date} onAddNotification={handleAddNotification} />
             </DialogContent>
           </Dialog>

          {/* Блок заметки с возможностью редактирования */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Запись</span>
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
              <div onClick={handleNoteClick} className="mt-1 cursor-pointer">
                {shiftData.notes ? (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 whitespace-pre-wrap">
                    {shiftData.notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-muted/30 rounded-md p-3 border border-dashed border-border">
                    Кликните, чтобы добавить запись...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}