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
import { generateSchedule, getWorkDaysInMonth, generate5DaySchedule, generate5DaySchedule15 } from "@/lib/schedule-utils"
import { loadScheduleData, saveScheduleData, loadTeamShifts } from "@/lib/storage"
import { defaultColors, colorPresets } from "@/lib/color-presets"
import { Settings2, Calendar, Edit2, Plus } from "lucide-react"
import { Menu as MenuIcon, Telegram } from "@mui/icons-material"
import { calculateVacationDaysWithHolidays } from "@/lib/vacation-utils"
import { checkNotifications, scheduleNotification } from "@/lib/notification-utils"
import {
  applyVisibleVacationsToSchedule,
  applyPreservedNotesAndVacations,
  reapplyAllVacations,
  type ReapplyVacationsParams,
} from "@/lib/schedule-merge-utils"


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
  const [visibilitySettings, setVisibilitySettings] = useState({
    showShiftInfo: true,
    showMonthProgress: true,
    showTodoList: true
  })
  const [scheduleType, setScheduleType] = useState<"2x2" | "5days">("2x2")
  const [schedule5DayType, setSchedule5DayType] = useState<"8hours" | "8-15">("8hours")

  useEffect(() => {
    const saved = loadScheduleData()
    if (saved) {
      setScheduleData(saved)
    } else {
      const startDate = new Date(2025, 0, 1)
      const shifts = generateSchedule(startDate, 7200, "Бригада 4")
      const monthlySettings = new Map<string, MonthlySettings>()

      setScheduleData({
        startDate: startDate,
        shifts,
        monthlySettings,
        globalSettings: {
          dayShiftColor: defaultColors.dayShift,
          nightShiftColor: defaultColors.nightShift,
          offShiftColor: "#6b7280",
        },
      })
    }
    setLoading(false)

    const savedCompletedTodos = localStorage.getItem('completedTodos')
    if (savedCompletedTodos) {
      setCompletedTodos(new Set(JSON.parse(savedCompletedTodos)))
    }

    // Загрузка сохраненной бригады
    const savedTeam = localStorage.getItem('selectedTeam')
    if (savedTeam) {
      setSelectedTeam(savedTeam)
    }

    // Загрузка сохраненных настроек видимости
    const savedVisibility = localStorage.getItem('visibilitySettings')
    if (savedVisibility) {
      setVisibilitySettings(JSON.parse(savedVisibility))
    }

    // Загрузка сохраненного типа графика
    const savedScheduleType = localStorage.getItem('scheduleType')
    if (savedScheduleType) {
      setScheduleType(savedScheduleType as "2x2" | "5days")
    }

    // Загрузка сохраненного типа графика 5 дней
    const savedSchedule5DayType = localStorage.getItem('schedule5DayType')
    if (savedSchedule5DayType) {
      setSchedule5DayType(savedSchedule5DayType as "8hours" | "8-15")
    }

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
      })
    }
  }, [])

  // Эффект для проверки уведомлений каждую минуту
  useEffect(() => {
    const checkAndScheduleNotifications = () => {
      if (!scheduleData) return;

      const now = new Date();
      const notificationsToShow = checkNotifications(scheduleData.shifts, now);

      notificationsToShow.forEach(notification => {
        scheduleNotification(`Уведомление на ${notification.time}`, {
          body: notification.message || 'У вас есть напоминание!',
        });
      });
    };

    // Проверяем уведомления сразу
    checkAndScheduleNotifications();

    // Устанавливаем интервал для проверки каждую минуту
    const intervalId = setInterval(checkAndScheduleNotifications, 60000);

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [scheduleData]);

  useEffect(() => {
    if (scheduleData) {
      saveScheduleData(scheduleData)
    }
  }, [scheduleData])

  useEffect(() => {
    localStorage.setItem('completedTodos', JSON.stringify(Array.from(completedTodos)))
  }, [completedTodos])

  // Сохранение выбранной бригады
  useEffect(() => {
    if (selectedTeam) {
      localStorage.setItem('selectedTeam', selectedTeam)
    }
  }, [selectedTeam])

  // Сохранение настроек видимости
  useEffect(() => {
    localStorage.setItem('visibilitySettings', JSON.stringify(visibilitySettings))
  }, [visibilitySettings])

  // Сохранение типа графика
  useEffect(() => {
    localStorage.setItem('scheduleType', scheduleType)
  }, [scheduleType])

  // Сохранение типа графика 5 дней
  useEffect(() => {
    localStorage.setItem('schedule5DayType', schedule5DayType)
  }, [schedule5DayType])

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

  const getVacationReapplyParams = (): ReapplyVacationsParams => ({
    scheduleType,
    schedule5DayType,
    selectedTeam,
    startDate: scheduleData.startDate,
  })

  const handleGenerateSchedule = (shifts: Map<string, Shift>, startDate: Date) => {
    setScheduleData(prev => {
      if (!prev) return prev

      const updatedShifts = new Map(shifts)
      applyVisibleVacationsToSchedule(updatedShifts, prev.vacations || [], {
        showWorkShiftsDuringVacation: prev.showWorkShiftsDuringVacation,
      })

      return {
        ...prev,
        startDate,
        shifts: updatedShifts,
      }
    })
  }

  const handleShowWorkShiftsDuringVacationChange = (enabled: boolean) => {
    setScheduleData((prev) => {
      if (!prev) return prev
      const updatedShifts = new Map(prev.shifts)
      const next = { ...prev, showWorkShiftsDuringVacation: enabled }
      reapplyAllVacations(updatedShifts, next, {
        scheduleType,
        schedule5DayType,
        selectedTeam,
        startDate: prev.startDate,
      })
      return { ...next, shifts: updatedShifts }
    })
  }

  const handleVacationSaveFromMenu = (vacation: { startDate: Date; days: number }) => {
    setScheduleData((prev) => {
      if (!prev) return prev
      const updatedVacations = [...(prev.vacations ?? []), { ...vacation, isVisible: true }]
      const updatedShifts = new Map(prev.shifts)
      const next = { ...prev, vacations: updatedVacations }
      reapplyAllVacations(updatedShifts, next, {
        scheduleType,
        schedule5DayType,
        selectedTeam,
        startDate: prev.startDate,
      })
      return { ...next, shifts: updatedShifts }
    })
  }

  const handleToggleVacation = (index: number, isVisible: boolean) => {
    setScheduleData((prev) => {
      if (!prev) return prev
      const updatedVacations = [...(prev.vacations || [])]
      updatedVacations[index] = { ...updatedVacations[index], isVisible }
      const updatedShifts = new Map(prev.shifts)
      const next = { ...prev, vacations: updatedVacations }
      reapplyAllVacations(updatedShifts, next, {
        scheduleType,
        schedule5DayType,
        selectedTeam,
        startDate: prev.startDate,
      })
      return { ...next, shifts: updatedShifts }
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

  const handleVacationDelete = (index: number) => {
    setScheduleData((prev) => {
      if (!prev?.vacations) return prev
      const updatedVacations = prev.vacations.filter((_, i) => i !== index)
      const updatedShifts = new Map(prev.shifts)
      const next = { ...prev, vacations: updatedVacations }
      reapplyAllVacations(updatedShifts, next, {
        scheduleType,
        schedule5DayType,
        selectedTeam,
        startDate: prev.startDate,
      })
      return { ...next, shifts: updatedShifts }
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

  const getValidTeam = (team: string): string => {
    const validTeams = ["Бригада 1", "Бригада 2", "Бригада 3", "Бригада 4"]
    return validTeams.includes(team) ? team : "Бригада 4"
  }

  const handleTeamSelect = (team: string) => {
    setSelectedTeam(team)

    const is8Hours = team === "8 часов"
    const is8Hours15 = team === "8 часов 15 минут"

    if (is8Hours) {
      setSchedule5DayType("8hours")
    } else if (is8Hours15) {
      setSchedule5DayType("8-15")
    }

    const startDate = new Date(2025, 0, 1)
    let newShifts: Map<string, Shift>

    if (scheduleType === "5days") {
      newShifts = is8Hours15
        ? generate5DaySchedule15(startDate, 7200)
        : generate5DaySchedule(startDate, 7200)
    } else {
      const teamToUse = getValidTeam(team)
      newShifts = generateSchedule(startDate, 7200, teamToUse as any)
    }

    const teamShifts = loadTeamShifts(team)
    if (teamShifts) {
      teamShifts.forEach((shift: Shift, date: string) => {
        if (shift.type && newShifts.has(date)) {
          const existingShift = newShifts.get(date)!
          newShifts.set(date, {
            ...existingShift,
            type: shift.type,
            hours: shift.hours,
            minutes: shift.minutes,
          })
        }
      })
    }

    applyPreservedNotesAndVacations(newShifts, scheduleData)
    const preservedVacations = scheduleData.vacations || []

    setScheduleData({
      ...scheduleData,
      startDate,
      shifts: newShifts,
      vacations: preservedVacations,
    })
  }
  const handleVisibilitySettingsSave = (settings: { showShiftInfo: boolean; showMonthProgress: boolean; showTodoList: boolean }) => {
    setVisibilitySettings(settings)
  }

  const handleScheduleTypeChange = (newType: "2x2" | "5days") => {
    setScheduleType(newType)
    const startDate = new Date(2025, 0, 1)
    let newShifts: Map<string, Shift>
    let newGlobalSettings: GlobalSettings

    if (newType === "5days") {
      // При переключении на 5-дневный график устанавливаем команду и цвета по умолчанию
      if (schedule5DayType === "8hours") {
        newShifts = generate5DaySchedule(startDate, 7200)
        setSelectedTeam("8 часов")
      } else {
        newShifts = generate5DaySchedule15(startDate, 7200)
        setSelectedTeam("8 часов 15 минут")
      }
      // Устанавливаем цветовую палитру для 5-дневного графика
      newGlobalSettings = {
        dayShiftColor: colorPresets.day[0], // Цвет для рабочих дней
        nightShiftColor: colorPresets.night[0], // Цвет для выходных
        offShiftColor: colorPresets.night[0],
      }
    } else {
      // При переключении на 2x2 график устанавливаем команду и цвета по умолчанию
      const defaultTeam = "Бригада 4"
      setSelectedTeam(defaultTeam)
      newShifts = generateSchedule(startDate, 7200, defaultTeam)
      // Устанавливаем цветовую палитру для 2x2 графика
      newGlobalSettings = {
        dayShiftColor: defaultColors.dayShift,
        nightShiftColor: defaultColors.nightShift,
        offShiftColor: "#6b7280",
      }
    }

    applyPreservedNotesAndVacations(newShifts, scheduleData)
    const preservedVacations = scheduleData.vacations || []

    setScheduleData({
      ...scheduleData,
      startDate,
      shifts: newShifts,
      globalSettings: newGlobalSettings,
      vacations: preservedVacations,
    })
  }

  const handleSchedule5DayTypeChange = (newType: "8hours" | "8-15") => {
    setSchedule5DayType(newType)
    const startDate = new Date(2025, 0, 1)
    let newShifts: Map<string, Shift>

    if (newType === "8hours") {
      newShifts = generate5DaySchedule(startDate, 7200)
      setSelectedTeam("8 часов")
    } else {
      newShifts = generate5DaySchedule15(startDate, 7200)
      setSelectedTeam("8 часов 15 минут")
    }

    applyPreservedNotesAndVacations(newShifts, scheduleData)
    const preservedVacations = scheduleData.vacations || []

    setScheduleData({
      ...scheduleData,
      startDate,
      shifts: newShifts,
      vacations: preservedVacations,
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
        onVisibilitySettingsSave={handleVisibilitySettingsSave}
        visibilitySettings={visibilitySettings}
        onScheduleTypeChange={handleScheduleTypeChange}
        currentScheduleType={scheduleType}
        vacations={scheduleData.vacations ?? []}
        showWorkShiftsDuringVacation={scheduleData.showWorkShiftsDuringVacation === true}
        onShowWorkShiftsDuringVacationChange={handleShowWorkShiftsDuringVacationChange}
        onVacationSave={handleVacationSaveFromMenu}
        onVacationDelete={handleVacationDelete}
        onToggleVacation={handleToggleVacation}
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
                <MenuIcon className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">{"График смен"}</h1>

              </div>
            </div>
            <div>
              <TeamSelector
                teams={["Бригада 1", "Бригада 2", "Бригада 3", "Бригада 4"]}
                selectedTeam={selectedTeam}
                onTeamSelect={handleTeamSelect}
                scheduleType={scheduleType}
                schedule5DayType={schedule5DayType}
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
              scheduleType={scheduleType}
              schedule5DayType={schedule5DayType}
              showWorkShiftsDuringVacation={scheduleData.showWorkShiftsDuringVacation === true}
              onVacationSave={(vacationDates) => {
                const updatedShifts = new Map(scheduleData.shifts)
                const showWork = scheduleData.showWorkShiftsDuringVacation === true
                vacationDates.forEach((date) => {
                  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                  if (showWork) {
                    const existing = updatedShifts.get(dateStr)
                    if (existing) {
                      updatedShifts.set(dateStr, { ...existing, isOnVacation: true })
                    } else {
                      updatedShifts.set(dateStr, {
                        date: dateStr,
                        type: "off",
                        hours: 0,
                        minutes: 0,
                        isOnVacation: true,
                      })
                    }
                  } else {
                    updatedShifts.set(dateStr, {
                      date: dateStr,
                      type: "off",
                      hours: 0,
                      minutes: 0,
                      isOnVacation: true,
                    })
                  }
                })
                setScheduleData({
                  ...scheduleData,
                  shifts: updatedShifts,
                })
              }}
            />
          </div>

          <div className="space-y-6">
             {visibilitySettings.showShiftInfo && (
               <ShiftDetailsPanel
                 shift={getSelectedShift()}
                 date={selectedDate}
                 formattedDate={formatDateString(selectedDate)}
                 onEdit={() => setEditingDate(selectedDate)}
                 onDelete={handleDeleteShift}
                 onNoteUpdate={handleNoteUpdate}
                 onNotificationDelete={handleNotificationDelete}
                 onNoteDelete={handleNoteDelete}
                 scheduleData={scheduleData}
                 setScheduleData={setScheduleData}
                 currentTeamId={selectedTeam || undefined}
               />
             )}

            {visibilitySettings.showMonthProgress && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Прогресс месяца</h3>
                <MonthSummary
                  shifts={scheduleData.shifts}
                  monthlySettings={scheduleData.monthlySettings}
                  globalSettings={scheduleData.globalSettings}
                  currentMonth={currentMonth || undefined}
                  onGenerateSchedule={handleGenerateSchedule}
                  selectedTeam={selectedTeam || undefined}
                  scheduleType={scheduleType}
                  schedule5DayType={schedule5DayType}
                />
              </div>
            )}

            {visibilitySettings.showTodoList && (
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
                    <button
                      onClick={() => setEditingGlobalNotes(true)}
                      className="mb-2 p-2 hover:bg-muted rounded transition-colors"
                      title="Добавить первую задачу"
                    >
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </button>
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
            )}
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
         scheduleType={scheduleType}
         schedule5DayType={schedule5DayType}
         scheduleData={scheduleData}
         setScheduleData={setScheduleData}
         currentTeamId={selectedTeam || undefined}
       />
      )}

      {editingGlobalNotes && (
        <GlobalNotesModal
          notes={scheduleData.globalNotes || ''}
          onSave={handleSaveGlobalNotes}
          onClose={() => setEditingGlobalNotes(false)}
          completedTodos={completedTodos}
          onTodoToggle={handleTodoToggle}
          onTodosUpdate={(updatedTodos) => {
            const newCompletedTodos = new Set<number>();
            updatedTodos.forEach((todo, index) => {
              if (todo.completed) {
                newCompletedTodos.add(index);
              }
            });
            setCompletedTodos(newCompletedTodos);
          }}
        />
      )}
    </div>
  )
}
