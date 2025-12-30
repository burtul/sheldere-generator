import React from 'react';
import type { Shift } from '@/lib/types';

interface ShiftEditorProps {
  date: string;
  shift: Shift | null;
  onSave: (shift: Shift) => void;
  onClose: () => void;
  formattedDate: string;
}

export function ShiftEditor({ date, shift, onSave, onClose, formattedDate }: ShiftEditorProps) {
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
    onSave(shiftData);
    onClose();
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
              <option value="day">Дневная</option>
              <option value="night">Ночная 1</option>
              <option value="night2">Ночная 2</option>
              <option value="off">Выходной</option>
              <option value="offn">Отсыпной</option>
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Заметки
            </label>
            <input
              type="text"
              name="notes"
              value={shiftData.notes}
              onChange={handleInputChange}
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
            />
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