"use client"

import { useState } from "react"
import type { MonthlySettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { X, RotateCcw } from "lucide-react"

interface MonthlySettingsProps {
  month: string
  settings: MonthlySettings
  onSave: (settings: MonthlySettings) => void
  onClose: () => void
  workDays: number
}

export function MonthlySettingsModal({ month, settings, onSave, onClose, workDays }: MonthlySettingsProps) {
  const [targetHours, setTargetHours] = useState(settings.targetHours)

  const handleAutoCalculate = () => {
    setTargetHours(workDays * 8)
  }

  const handleSave = () => {
    onSave({
      month,
      targetHours,
    })
    onClose()
  }

  const defaultTargetHours = workDays * 8

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 border border-border max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">Настройки {month}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Норма рабочих часов {month}</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={targetHours}
                  onChange={(e) => setTargetHours(Number(e.target.value))}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded-md text-foreground"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoCalculate}
                  title={`${workDays} work days × 8 hours = ${defaultTargetHours} hours`}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Рабочих дней {workDays} • Часы: {defaultTargetHours}h
              </p>
            </div>
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
      </div>
    </div>
  )
}
