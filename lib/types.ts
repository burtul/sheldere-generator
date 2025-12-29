export type ShiftType = "day" | "night" | "night2" | "off" | "offn"

export interface Notification {
  id: string
  time: string // HH:MM format
  message: string
}

export interface Shift {
  date: string
  type: ShiftType
  hours: number
  minutes: number
  notes?: string
  notifications?: Notification[]
}

export interface MonthlySettings {
  month: string // YYYY-MM
  targetHours: number
}

export interface GlobalSettings {
  dayShiftColor: string
  nightShiftColor: string
  customNumber?: number
}

export interface ScheduleData {
  startDate: Date
  shifts: Map<string, Shift>
  monthlySettings: Map<string, MonthlySettings>
  globalSettings: GlobalSettings
  globalNotes?: string
}
