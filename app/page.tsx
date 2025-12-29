 "use client";

 import { useState, useEffect } from "react"
 import { ShiftCalendar } from "@/components/shift-calendar"
 import { MonthlySettingsModal } from "@/components/monthly-settings"
 import { ShiftEditor } from "@/components/shift-editor"
 import { MonthSummary } from "@/components/month-summary"
 import { ShiftDetailsPanel } from "@/components/shift-details-panel"
 import { OfflineIndicator } from "@/components/offline-indicator"
 import { GlobalSettingsModal } from "@/components/global-settings"
 import { GlobalNotesModal } from "@/components/global-notes-modal"
 import { TeamSelector } from "@/components/team-selector"
 import BurgerMenu from "@/components/burger-menu"
 import type { ScheduleData, MonthlySettings, Shift, GlobalSettings } from "@/lib/types"
 import { generateSchedule, getWorkDaysInMonth } from "@/lib/schedule-utils"
 import { loadScheduleData, saveScheduleData } from "@/lib/storage"
 import { defaultColors } from "@/lib/color-presets"
 import { Settings2, Calendar, Menu, Edit2, Plus } from "lucide-react"

export default function Dashboard() {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [editingMonth, setEditingMonth] = useState<string | null>(null)
  const [editingGlobalSettings, setEditingGlobalSettings] = useState(false)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false)
  const [isBurgerMenuClosing, setIsBurgerMenuClosing] = useState(false)
  const [editingGlobalNotes, setEditingGlobalNotes] = useState(false)
  const [completedTodos, setCompletedTodos] = useState<Set<number>>(new Set())
  const [selectedTeam, setSelectedTeam] = useState<string | null>("Бригада 4")
  const [currentMonth, setCurrentMonth] = useState<string | null>(null)

  useEffect(() => {
    const saved = loadScheduleData()
    if (saved) {
      setScheduleData(saved)
    } else {
      const startDate = new Date(2025, 0, 1)
      const shifts = generateSchedule(startDate, 730, "Бригада 4")
      const monthlySettings = new Map<string, MonthlySettings>()

      setScheduleData({
        startDate: startDate,
        shifts,
        monthlySettings,
        globalSettings: {
          dayShiftColor: defaultColors.dayShift,
          nightShiftColor: defaultColors.nightShift,
        },
      })
    }
    setLoading(false)

    const savedCompletedTodos = localStorage.getItem('completedTodos')
    if (savedCompletedTodos) {
      setCompletedTodos(new Set(JSON.parse(savedCompletedTodos)))
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
      })
    }
  }, [])

  useEffect(() => {
    if (scheduleData) {
      saveScheduleData(scheduleData)
    }
  }, [scheduleData])

  useEffect(() => {
    localStorage.setItem('completedTodos', JSON.stringify(Array.from(completedTodos)))
  }, [completedTodos])

  const handleNotificationDelete = (date: string, notificationId: string) => {
    const newShifts = new Map(scheduleData!.shifts)
    const shift = newShifts.get(date)
    if (shift && shift.notifications) {
      const updatedNotifications = shift.notifications.filter((n: any) => n.id !== notificationId)
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

  const handleNoteUpdate = (date: string, note: string) => {
    const newShifts = new Map(scheduleData!.shifts)
    const shift = newShifts.get(date)
    if (shift) {
      newShifts.set(date, {
        ...shift,
        notes: note
      })
    } else {
      newShifts.set(date, {
        date,
        type: 'day',
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

  const handleNoteDelete = (date: string) => {
    const newShifts = new Map(scheduleData!.shifts)
    const shift = newShifts.get(date)
    if (shift) {
      newShifts.set(date, {
        ...shift,
        notes: "",
        notifications: undefined
      })
      setScheduleData({
        ...scheduleData!,
        shifts: newShifts
      })
    }
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
    setEditingDate(dateStr)
  }

  const handleDateSelect = (dateStr: string | null) => {
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
    console.log('handleDeleteShift called, selectedDate:', selectedDate)
    if (selectedDate) {
      const newShifts = new Map(scheduleData!.shifts)
      const shift = newShifts.get(selectedDate)
      if (shift) {
        newShifts.set(selectedDate, {
          ...shift,
          type: 'off',
          hours: 0,
          minutes: 0
        })
        setScheduleData({
          ...scheduleData!,
          shifts: newShifts,
        })
        setSelectedDate(null)
      }
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

  const handleBurgerMenuClose = () => {
    setIsBurgerMenuClosing(true)
    setTimeout(() => {
      setIsBurgerMenuOpen(false)
      setIsBurgerMenuClosing(false)
    }, 300)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleBurgerMenuClose()
    }
  }

  const handleSaveGlobalNotes = (notes: string) => {
    setScheduleData({
      ...scheduleData!,
      globalNotes: notes,
    })
    setEditingGlobalNotes(false)
  }

  const getTodos = () => {
    if (!scheduleData.globalNotes) return [];
    return scheduleData.globalNotes.split('\n').filter((n: string) => n.trim() !== '');
  };

  const handleTodoToggle = (index: number) => {
    const newCompletedTodos = new Set(completedTodos)
    if (newCompletedTodos.has(index)) {
      newCompletedTodos.delete(index)
    } else {
      newCompletedTodos.add(index)
    }
    setCompletedTodos(newCompletedTodos)
  }

  const handleTeamSelect = (team: string) => {
    setSelectedTeam(team)
    const startDate = new Date(2025, 0, 1)
    const newShifts = generateSchedule(startDate, 730, team as any)
    
    // Сохраняем заметки и уведомления из текущих смен
    const preservedShifts = new Map<string, Shift>()
    scheduleData.shifts.forEach((shift, date) => {
      if (shift.notes || (shift.notifications && shift.notifications.length > 0)) {
        const newShift = newShifts.get(date)
        if (newShift) {
          preservedShifts.set(date, {
            ...newShift,
            notes: shift.notes,
            notifications: shift.notifications
          })
        }
      }
    })
    
    // Объединяем новые смены с сохраненными данными
    preservedShifts.forEach((shift, date) => {
      newShifts.set(date, shift)
    })
    
    setScheduleData({
      ...scheduleData,
      startDate: startDate,
      shifts: newShifts,
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OfflineIndicator />

      <BurgerMenu
        isOpen={isBurgerMenuOpen}
        isClosing={isBurgerMenuClosing}
        scheduleData={scheduleData}
        onClose={handleBurgerMenuClose}
        onBackdropClick={handleBackdropClick}
        onGlobalSettingsSave={handleSaveGlobalSettings}
        onGlobalNotesSave={() => setEditingGlobalNotes(true)}
      />

      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBurgerMenuOpen(true)}
                className="p-2 hover:bg-card rounded-lg transition-colors"
                title="Open Menu"
              >
                <Menu className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{"График смен эдишон"}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">2/2 график смен </p>
              </div>
            </div>
            <div>
              <TeamSelector
                teams={["Бригада 1", "Бригада 2", "Бригада 3", "Бригада 4"]}
                selectedTeam={selectedTeam}
                onTeamSelect={handleTeamSelect}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ShiftCalendar
              shifts={scheduleData.shifts}
              monthlySettings={scheduleData.monthlySettings}
              globalSettings={scheduleData.globalSettings}
              onDateClick={handleDateClick}
              onEditMonth={handleEditMonth}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onGenerateSchedule={handleGenerateSchedule}
              selectedTeam={selectedTeam}
              onCurrentMonthChange={setCurrentMonth}
            />
          </div>

          <div className="space-y-6">
            <ShiftDetailsPanel
              shift={getSelectedShift()}
              date={selectedDate}
              formattedDate={formatDateString(selectedDate)}
              onEdit={() => setEditingDate(selectedDate)}
              onDelete={handleDeleteShift}
              onNoteUpdate={handleNoteUpdate}
              onNotificationDelete={handleNotificationDelete}
              onNoteDelete={handleNoteDelete}
            />

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Прогресс месяца</h3>
              <MonthSummary
                shifts={scheduleData.shifts}
                monthlySettings={scheduleData.monthlySettings}
                globalSettings={scheduleData.globalSettings}
                currentMonth={currentMonth || undefined}
                onGenerateSchedule={handleGenerateSchedule}
                selectedTeam={selectedTeam || undefined}
              />
            </div>

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Список дел</h3>
                <button
                  onClick={() => setEditingGlobalNotes(true)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Редактировать список дел"
                >
                  <Edit2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              {scheduleData.globalNotes ? (
                <div className="space-y-2">
                  {getTodos().map((todo: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 border border-border rounded-lg bg-background">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={completedTodos.has(index)}
                        onChange={() => handleTodoToggle(index)}
                      />
                      <span
                        className={`flex-1 text-foreground ${completedTodos.has(index) ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {todo}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Нет задач</p>
                  <button
                    onClick={() => setEditingGlobalNotes(true)}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Добавить первую задачу
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {editingGlobalSettings && (
        <GlobalSettingsModal
          settings={scheduleData.globalSettings}
          onSave={handleSaveGlobalSettings}
          onGenerate={handleGenerateSchedule}
          onClose={() => setEditingGlobalSettings(false)}
        />
      )}

      {editingMonth && getEditingMonthData() && (
        <MonthlySettingsModal
          month={editingMonth}
          settings={getEditingMonthData()!.settings}
          workDays={getEditingMonthData()!.workDays}
          onSave={handleSaveMonthSettings}
          onClose={() => setEditingMonth(null)}
        />
      )}

      {editingDate && (
        <ShiftEditor
          date={editingDate}
          shift={getEditingShift()}
          onSave={handleSaveShift}
          onClose={() => setEditingDate(null)}
          formattedDate={formatDateString(editingDate) || ''}
        />
      )}

      {editingGlobalNotes && (
        <GlobalNotesModal
          notes={scheduleData.globalNotes || ''}
          onSave={handleSaveGlobalNotes}
          onClose={() => setEditingGlobalNotes(false)}
        />
      )}
    </div>
  )
}
