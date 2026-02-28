export type ShiftType = "day" | "night" | "night2" | "off" | "offn" | "weekday" | "weekday15" | "weekday7"

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
  isHoliday?: boolean
  holidayHours?: number
}

export interface MonthlySettings {
  month: string // YYYY-MM
  targetHours: number
}

export interface GlobalSettings {
  dayShiftColor: string
  nightShiftColor: string
  offShiftColor: string
  customNumber?: number
  baseDate?: Date // Используется объект Date для унифицированной обработки
}

export interface TeamShiftData {
  teamId: string;
  shifts: Map<string, Shift>;
}

export interface ScheduleData {
  startDate: Date;
  shifts: Map<string, Shift>;
  monthlySettings: Map<string, MonthlySettings>;
  globalSettings: GlobalSettings;
  globalNotes?: string;
  vacations?: { startDate: Date; days: number }[];
  teamShifts?: TeamShiftData[];
}

export interface Holiday {
  id: string
  name: string
  date: string // YYYY-MM-DD format
  type: "national" | "regional" | "religious" | "custom"
  region?: string // Optional region code or name
  isRecurring: boolean
  isWorkHoliday?: boolean // Флаг для рабочих праздников
  description?: string
}

export type HolidaysData = Holiday[]
