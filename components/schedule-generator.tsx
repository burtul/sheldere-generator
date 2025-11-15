"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { generateSchedule, SHIFT_PATTERN } from "@/lib/schedule-utils"
import { AlertCircle } from "lucide-react"

interface ScheduleGeneratorProps {
  onGenerate: (shifts: Map<string, any>, startDate: Date) => void
}

export function ScheduleGenerator({ onGenerate }: ScheduleGeneratorProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [startShift, setStartShift] = useState(0)
  const [years, setYears] = useState(3)
  const [showInfo, setShowInfo] = useState(false)

  const handleGenerate = () => {
    const date = new Date(startDate)
    const shifts = generateSchedule(date, years, startShift)
    onGenerate(shifts, date)
  }

  const getShiftLabel = (shift: string, idx: number) => {
    const labels: { [key: number]: string } = {
      0: "Day 1 (12h)",
      1: "Day 2 (12h)",
      2: "Off 1",
      3: "Off 2",
      4: "Night 1 (4h)",
      5: "Night 2 (12h)",
      6: "Off 3 (8h)",
      7: "Off 4",
    }
    return labels[idx] || shift
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Генерация графика</h3>
        <button onClick={() => setShowInfo(!showInfo)} className="text-muted-foreground hover:text-foreground">
          <AlertCircle className="h-4 w-4" />
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 p-3 bg-muted/50 rounded-md border border-border">
          <p className="text-xs text-muted-foreground">
           2 дневные → 2 выходных → 2 ночные → Отсыпной → Выходной
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Начальная дата</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Тип смены</label>
          <select
            value={startShift}
            onChange={(e) => setStartShift(Number(e.target.value))}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
          >
            {SHIFT_PATTERN.map((shift, idx) => (
              <option key={idx} value={idx}>
                {getShiftLabel(shift, idx)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Количество лет</label>
          <input
            type="number"
            min="1"
            max="5"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
          />
        </div>

        <Button onClick={handleGenerate} className="w-full">
          Генерация графика
        </Button>
      </div>
    </div>
  )
}
