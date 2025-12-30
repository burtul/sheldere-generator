"use client"

import { useState } from "react"
import type { GlobalSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { X, Palette, Calculator, Calendar as CalendarIcon } from "lucide-react"
import { ScheduleGenerator } from "@/components/schedule-generator"

interface GlobalSettingsModalProps {
  settings: GlobalSettings
  onSave: (settings: GlobalSettings) => void
  onGenerate: (shifts: Map<string, any>, startDate: Date) => void
  onClose: () => void
}

export function GlobalSettingsModal({ settings, onSave, onGenerate, onClose }: GlobalSettingsModalProps) {
  const [activeSection, setActiveSection] = useState<"main" | "colors" | "salary" | "schedule">("main")
  const [dayColor, setDayColor] = useState(settings.dayShiftColor || "#dc2626")
  const [nightColor, setNightColor] = useState(settings.nightShiftColor || "#1e293b")
  const [offColor, setOffColor] = useState(settings.offShiftColor || "#64748b")
  const [customNumber, setCustomNumber] = useState<string>(settings.customNumber?.toString() || "")

  const colorPresets = {
    day: ["#dc2626", "#ea580c", "#d97706", "#ca8a04", "#65a30d", "#16a34a", "#059669", "#0d9488", "#0891b2", "#0284c7", "#2563eb", "#4f46e5", "#7c3aed", "#9333ea", "#c026d3", "#db2777", "#e11d48"],
    night: ["#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f1f5f9", "#0f172a", "#1e1b4b", "#312e81", "#3730a3", "#4338ca", "#4f46e5", "#6366f1"],
    off: ["#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f1f5f9"]
  }

  const handleSaveSettings = () => {
    const trimmedValue = customNumber.trim()
    const numValue = trimmedValue === "" ? undefined : parseFloat(trimmedValue)
    
    const updatedSettings: GlobalSettings = {
      dayShiftColor: dayColor,
      nightShiftColor: nightColor,
      offShiftColor: offColor,
      ...(numValue !== undefined && !isNaN(numValue) && { customNumber: numValue })
    }
    
    onSave(updatedSettings)
    setActiveSection("main")
  }

  const handleGenerateSchedule = (shifts: Map<string, any>, startDate: Date) => {
    onGenerate(shifts, startDate)
    setActiveSection("main")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg p-6 border border-border max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          {activeSection === "main" ? (
            <h3 className="text-lg font-semibold text-foreground">Глобальные настройки</h3>
          ) : (
            <button 
              onClick={() => setActiveSection("main")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              Назад
            </button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {activeSection === "main" && (
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveSection("colors")}
                className="w-full flex items-center gap-3 text-left p-3 hover:bg-muted rounded-lg transition-colors"
              >
                <Palette className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium">Цвета смен</div>
                  <div className="text-sm text-muted-foreground">Настройка цветов</div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSection("salary")}
                className="w-full flex items-center gap-3 text-left p-3 hover:bg-muted rounded-lg transition-colors"
              >
                <Calculator className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium">Оклад</div>
                  <div className="text-sm text-muted-foreground">Настройка оклада</div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSection("schedule")}
                className="w-full flex items-center gap-3 text-left p-3 hover:bg-muted rounded-lg transition-colors"
              >
                <CalendarIcon className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="font-medium">Генератор графика</div>
                  <div className="text-sm text-muted-foreground">Создание графика</div>
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
                <div className="flex gap-2 flex-wrap">
                  {colorPresets.day.map((color) => (
                    <button
                      key={color}
                      onClick={() => setDayColor(color)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        dayColor === color ? "border-accent shadow-lg scale-110" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Цвет ночной смены</label>
                <div className="flex gap-2 flex-wrap">
                  {colorPresets.night.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNightColor(color)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        nightColor === color ? "border-accent shadow-lg scale-110" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Цвет выходного дня</label>
                <div className="flex gap-2 flex-wrap">
                  {colorPresets.off.map((color) => (
                    <button
                      key={color}
                      onClick={() => setOffColor(color)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        offColor === color ? "border-accent shadow-lg scale-110" : "border-border"
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

          {/* Schedule Generator Section */}
          {activeSection === "schedule" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Генератор графика</h3>
              <ScheduleGenerator onGenerate={handleGenerateSchedule} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}