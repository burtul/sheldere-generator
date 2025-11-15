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
  const [editingGlobalSettings, setEditingGlobalSettings] = useState(false) // added state for global settings modal
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
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
          // initialize global settings
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
    const [year, month, day] = dateStr.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    setSelectedDate(date)
    setEditingDate(dateStr)
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
      const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
      const newShifts = new Map(scheduleData!.shifts)
      newShifts.delete(dateKey)
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

  const getSelectedShift = () => {
    if (!selectedDate) return null
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    return scheduleData!.shifts.get(dateStr) || null
  }

  const getEditingShift = () => {
    if (!editingDate) return null
    return scheduleData!.shifts.get(editingDate) || null
  }

  const upcomingMonths = Array.from({ length: 3 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() + i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })

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
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{"График смен  эдишон"}</h1>
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
              globalSettings={scheduleData.globalSettings} // pass global settings to calendar
              onDateClick={handleDateClick}
              onEditMonth={handleEditMonth}
            />
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-6">
            {/* Shift Details Panel */}
            <ShiftDetailsPanel
              shift={getSelectedShift()}
              date={selectedDate}
              onEdit={() => setEditingDate(selectedDate ? selectedDate.toISOString().split("T")[0] : null)}
              onDelete={handleDeleteShift}
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
          onGenerate={handleGenerateSchedule} // added onGenerate prop
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
        />
      )}
    </div>
  )
}
