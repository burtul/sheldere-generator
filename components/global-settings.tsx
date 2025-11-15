"use client"

import { useState } from "react"
import type { GlobalSettings } from "@/lib/types"
import { colorPresets } from "@/lib/color-presets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { ScheduleGenerator } from "@/components/schedule-generator"

interface GlobalSettingsProps {
  settings: GlobalSettings
  onSave: (settings: GlobalSettings) => void
  onClose: () => void
  onGenerate?: (shifts: Map<string, any>, startDate: Date) => void
}

export function GlobalSettingsModal({ settings, onSave, onClose, onGenerate }: GlobalSettingsProps) {
  const [dayColor, setDayColor] = useState(settings.dayShiftColor)
  const [nightColor, setNightColor] = useState(settings.nightShiftColor)
  const [customNumber, setCustomNumber] = useState<string>(settings.customNumber?.toString() || "")
  const [activeTab, setActiveTab] = useState<"colors" | "salary" | "schedule">("colors")

  const handleSave = () => {
    const trimmedValue = customNumber.trim()
    const numValue = trimmedValue === "" ? undefined : parseFloat(trimmedValue)
    onSave({
      dayShiftColor: dayColor,
      nightShiftColor: nightColor,
      customNumber: numValue !== undefined && !isNaN(numValue) ? numValue : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg border border-border max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">Настройки</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("colors")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "colors"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Цвета
          </button>
          <button
            onClick={() => setActiveTab("salary")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "salary"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Оклад
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "schedule"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            График
          </button>
        </div>

        <div className="p-6">
          {activeTab === "colors" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Цвет дневной смены</label>
                <div className="flex gap-2 flex-wrap">
                  {colorPresets.day.map((color) => (
                    <button
                      key={color}
                      onClick={() => setDayColor(color)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        dayColor === color ? "border-accent shadow-lg" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Цвет ночной смены</label>
                <div className="flex gap-2 flex-wrap">
                  {colorPresets.night.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNightColor(color)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        nightColor === color ? "border-accent shadow-lg" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Отмена
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Сохранить цвет
                </Button>
              </div>
            </div>
          )}

          {activeTab === "salary" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Оклад</label>
                <Input
                  type="number"
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  placeholder="Введите оклад"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Оклад используется для расчета аванса на основе отработанных часов с 1 по 15 число месяца
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Отмена
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Сохранить
                </Button>
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div>
              <ScheduleGenerator
                onGenerate={(shifts, date) => {
                  onGenerate?.(shifts, date)
                  onClose()
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
