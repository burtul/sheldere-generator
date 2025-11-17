"use client"

import { useState, useEffect } from "react"
import { ShiftCalendar } from "@/components/shift-calendar"
import { MonthlySettingsModal } from "@/components/monthly-settings"
import { GlobalSettingsModal } from "@/components/global-settings"
import { ShiftEditor } from "@/components/shift-editor"
import { MonthSummary } from "@/components/month-summary"
import { ShiftDetailsPanel } from "@/components/shift-details-panel"
import { OfflineIndicator } from "@/components/offline-indicator"
import type { ScheduleData, MonthlySettings, Shift, GlobalSettings } from "@/lib/types"
import { generateSchedule, getWorkDaysInMonth } from "@/lib/schedule-utils"
import { loadScheduleData, saveScheduleData } from "@/lib/storage"
import { defaultColors } from "@/lib/color-presets"
import { Settings2, Calendar } from "lucide-react"

export default function Dashboard() {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [editingMonth, setEditingMonth] = useState<string | null>(null)
  const [editingGlobalSettings, setEditingGlobalSettings] = useState(false)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null) // Изменено на string
  const [loading, setLoading] = useState(true)

  // Load data on mount and register service worker
  useEffect(() => {
    const saved = loadScheduleData()
    if (saved) {
      setScheduleData(saved)
    } else {
      const today = new Date()
      const shifts = generateSchedule(today, 3, 0)
      const monthlySettings = new Map<string, MonthlySettings>()

      setScheduleData({
        startDate: today,
        shifts,
        monthlySettings,
        globalSettings: {
          dayShiftColor: defaultColors.dayShift,
          nightShiftColor: defaultColors.nightShift,
        },
      })
    }
    setLoading(false)

    // Register service worker for offline support
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration failed, app still works online
      })
    }
  }, [])

  // Save data whenever it changes
  useEffect(() => {
    if (scheduleData) {
      saveScheduleData(scheduleData)
    }
  }, [scheduleData])

  // Функция для удаления уведомления
  const handleNotificationDelete = (date: string, notificationId: string) => {
    const newShifts = new Map(scheduleData!.shifts)
    const shift = newShifts.get(date)
    if (shift && shift.notifications) {
      const updatedNotifications = shift.notifications.filter(n => n.id !== notificationId)
      newShifts.set(date, {
        ...shift,
        notifications: updatedNotifications.length > 0 ? updatedNotifications : undefined
      })
      setScheduleData({
        ...scheduleData!,
        shifts: newShifts
      })
    }
  }

  // Функция для обновления заметки
  const handleNoteUpdate = (date: string, note: string) => {
    const newShifts = new Map(scheduleData!.shifts)
    const shift = newShifts.get(date)
    if (shift) {
      // Обновляем заметку у существующей смены
      newShifts.set(date, {
        ...shift,
        notes: note
      })
    } else {
      // Если смены нет, то создаем новую смену с заметкой
      newShifts.set(date, {
        date,
        type: 'day', // тип по умолчанию
        hours: 0,
        minutes: 0,
        notes: note,
        notifications: []
      })
    }
    setScheduleData({
      ...scheduleData!,
      shifts: newShifts
    })
  }

  if (loading || !scheduleData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  const handleGenerateSchedule = (shifts: Map<string, Shift>, startDate: Date) => {
    setScheduleData({
      ...scheduleData,
      startDate,
      shifts,
    })
  }

  const handleEditMonth = (month: string) => {
    setEditingMonth(month)
  }

  const handleSaveMonthSettings = (settings: MonthlySettings) => {
    const newSettings = new Map(scheduleData.monthlySettings)
    newSettings.set(settings.month, settings)
    setScheduleData({
      ...scheduleData,
      monthlySettings: newSettings,
    })
  }

  const handleSaveGlobalSettings = (settings: GlobalSettings) => {
    setScheduleData({
      ...scheduleData,
      globalSettings: settings,
    })
  }

  const handleDateClick = (dateStr: string) => {
    // Двойной клик - открываем редактор
    setEditingDate(dateStr)
  }

  const handleDateSelect = (dateStr: string | null) => {
    // Одиночный клик - выбираем дату
    setSelectedDate(dateStr)
  }

  const handleSaveShift = (shift: Shift) => {
    const newShifts = new Map(scheduleData!.shifts)
    newShifts.set(shift.date, shift)
    setScheduleData({
      ...scheduleData!,
      shifts: newShifts,
    })
  }

  const handleDeleteShift = () => {
    if (selectedDate) {
      const newShifts = new Map(scheduleData!.shifts)
      newShifts.delete(selectedDate)
      setScheduleData({
        ...scheduleData!,
        shifts: newShifts,
      })
      setSelectedDate(null)
    }
  }

  const getEditingMonthData = () => {
    if (!editingMonth) return null

    const [year, month] = editingMonth.split("-").map(Number)
    const existing = scheduleData.monthlySettings.get(editingMonth)
    const workDays = getWorkDaysInMonth(year, month - 1)

    return {
      settings: existing || {
        month: editingMonth,
        targetHours: workDays * 8,
      },
      workDays,
    }
  }

  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getSelectedShift = () => {
    if (!selectedDate) return null
    return scheduleData!.shifts.get(selectedDate) || null
  }

  const getEditingShift = () => {
    if (!editingDate) return null
    return scheduleData!.shifts.get(editingDate) || null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{"График смен эдишон"}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">2/2 график смен </p>
              </div>
            </div>
            <button
              onClick={() => setEditingGlobalSettings(true)}
              className="p-2 hover:bg-card rounded-lg transition-colors"
              title="Global Settings"
            >
              <Settings2 className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-2 space-y-6">
            <ShiftCalendar
              shifts={scheduleData.shifts}
              monthlySettings={scheduleData.monthlySettings}
              globalSettings={scheduleData.globalSettings}
              onDateClick={handleDateClick}
              onEditMonth={handleEditMonth}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-6">
            {/* Shift Details Panel */}
            <ShiftDetailsPanel
              shift={getSelectedShift()}
              date={selectedDate}
              formattedDate={formatDateString(selectedDate)}
              onEdit={() => setEditingDate(selectedDate)}
              onDelete={handleDeleteShift}
              onNoteUpdate={handleNoteUpdate}
              onNotificationDelete={handleNotificationDelete}
            />

            {/* Monthly Progress */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Прогресс месяца</h3>
              <MonthSummary
                shifts={scheduleData.shifts}
                monthlySettings={scheduleData.monthlySettings}
                globalSettings={scheduleData.globalSettings}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Global Settings Modal */}
      {editingGlobalSettings && (
        <GlobalSettingsModal
          settings={scheduleData.globalSettings}
          onSave={handleSaveGlobalSettings}
          onGenerate={handleGenerateSchedule}
          onClose={() => setEditingGlobalSettings(false)}
        />
      )}

      {/* Settings Modal */}
      {editingMonth && getEditingMonthData() && (
        <MonthlySettingsModal
          month={editingMonth}
          settings={getEditingMonthData()!.settings}
          workDays={getEditingMonthData()!.workDays}
          onSave={handleSaveMonthSettings}
          onClose={() => setEditingMonth(null)}
        />
      )}

      {/* Shift Editor Modal */}
      {editingDate && (
        <ShiftEditor
          date={editingDate}
          shift={getEditingShift()}
          onSave={handleSaveShift}
          onClose={() => setEditingDate(null)}
          formattedDate={formatDateString(editingDate) || ''}
        />
      )}
    </div>
  )
}