"use client"

import { useState, useEffect } from "react"
import type { ScheduleData, GlobalSettings } from "@/lib/types"
import { Palette, Calculator, X, StickyNote } from "lucide-react"

interface BurgerMenuProps {
  isOpen: boolean
  isClosing: boolean
  scheduleData: ScheduleData
  onClose: () => void
  onBackdropClick: (e: React.MouseEvent) => void
  onGlobalSettingsSave: (settings: GlobalSettings) => void
  onGlobalNotesSave: (notes: string) => void
}

export default function BurgerMenu({
  isOpen,
  isClosing,
  scheduleData,
  onClose,
  onBackdropClick,
  onGlobalSettingsSave,
  onGlobalNotesSave
}: BurgerMenuProps) {
  const [activeSection, setActiveSection] = useState<"main" | "colors" | "salary">("main")
  const [dayColor, setDayColor] = useState(scheduleData.globalSettings.dayShiftColor)
  const [nightColor, setNightColor] = useState(scheduleData.globalSettings.nightShiftColor)
  const [customNumber, setCustomNumber] = useState<string>(scheduleData.globalSettings.customNumber?.toString() || "")

  const colorPresets = {
    day: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
    night: ["#6b7280", "#1f2937", "#4f46e5", "#7c3aed", "#06b6d4"]
  }

  useEffect(() => {
    if (isOpen) {
      setActiveSection("main")
    }
  }, [isOpen])

  const handleSaveSettings = () => {
    const trimmedValue = customNumber.trim()
    const numValue = trimmedValue === "" ? undefined : parseFloat(trimmedValue)
     
    onGlobalSettingsSave({
      dayShiftColor: dayColor,
      nightShiftColor: nightColor,
      customNumber: numValue !== undefined && !isNaN(numValue) ? numValue : undefined,
    })
    setActiveSection("main")
  }

  const handleOpenGlobalNotes = () => {
    onGlobalNotesSave("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={onBackdropClick}
    >
      <div 
        className={`absolute left-0 top-0 h-full w-80 bg-background border-r border-border transform transition-transform duration-300 ${
          isClosing ? '-translate-x-full' : 'translate-x-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {activeSection === "main" ? (
            <h2 className="text-lg font-semibold">Меню</h2>
          ) : (
            <button 
              onClick={() => setActiveSection("main")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              Назад
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-card rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 h-[calc(100vh-80px)] overflow-y-auto">
          {activeSection === "main" && (
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveSection("colors")}
                className="w-full flex items-center gap-3 text-left p-3 hover:bg-card rounded-lg transition-colors"
              >
                <Palette className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium">Цвета смен</div>
                  <div className="text-sm text-muted-foreground">Настройка цветов</div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSection("salary")}
                className="w-full flex items-center gap-3 text-left p-3 hover:bg-card rounded-lg transition-colors"
              >
                <Calculator className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium">Оклад</div>
                  <div className="text-sm text-muted-foreground">Настройка оклада</div>
                </div>
              </button>

              <button 
                onClick={handleOpenGlobalNotes}
                className="w-full flex items-center gap-3 text-left p-3 hover:bg-card rounded-lg transition-colors"
              >
                <StickyNote className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="font-medium">Список дел</div>
                  <div className="text-sm text-muted-foreground">Редактировать список дел</div>
                </div>
              </button>
            </nav>
          )}

          {/* Colors Section */}
          {activeSection === "colors" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Цвета смен</h3>
               
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Цвет дневной смены</label>
                <div className="flex gap-2 flex-wrap w-full">
                  {colorPresets.day.map((color) => (
                    <button
                      key={color}
                      onClick={() => setDayColor(color)}
                      className={`flex-1 min-w-[calc(20%-0.5rem)] h-12 rounded-md border-2 transition-all ${
                        dayColor === color ? "border-accent shadow-lg scale-105" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Цвет ночной смены</label>
                <div className="flex gap-2 flex-wrap w-full">
                  {colorPresets.night.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNightColor(color)}
                      className={`flex-1 min-w-[calc(20%-0.5rem)] h-12 rounded-md border-2 transition-all ${
                        nightColor === color ? "border-accent shadow-lg scale-105" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSaveSettings}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Сохранить цвета
              </button>
            </div>
          )}

          {/* Salary Section */}
          {activeSection === "salary" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Настройка оклада</h3>
               
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Оклад</label>
                <input
                  type="number"
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  placeholder="Введите оклад"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Для расчета аванса
                </p>
              </div>

              <button 
                onClick={handleSaveSettings}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Сохранить оклад
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}