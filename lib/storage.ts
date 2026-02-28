import type { ScheduleData, Shift } from "./types"
import { isValidDate } from "./utils"
import { DEFAULT_PATTERN_BASE_DATE } from "./schedule-utils"

const STORAGE_KEY = "shift_schedule_data"
const TEAM_SHIFTS_STORAGE_KEY = (teamId: string) => {
  if (!teamId) throw new Error("teamId cannot be null or undefined");
  return `team_shifts_data_${teamId}`;
};

function serializeScheduleData(data: ScheduleData): any {
  return {
    startDate: data.startDate.toISOString(),
    shifts: Array.from(data.shifts.entries()),
    monthlySettings: Array.from(data.monthlySettings.entries()),
    globalSettings: {
      ...data.globalSettings,
      // Преобразуем Date в ISO-строку для сохранения
      baseDate: data.globalSettings.baseDate instanceof Date ? data.globalSettings.baseDate.toISOString() : undefined,
    },
    globalNotes: data.globalNotes,
    vacations: data.vacations?.map(v => ({
      startDate: v.startDate.toISOString(),
      days: v.days,
    })) ?? [],
    teamShifts: data.teamShifts?.map(team => ({
      teamId: team.teamId,
      shifts: Array.from(team.shifts.entries()),
    })) ?? [],
  };
}

function deserializeScheduleData(serialized: any): ScheduleData {
  const shifts = new Map<string, Shift>();
  serialized.shifts.forEach(([dateKey, shift]: [string, any]) => {
    const hours = (shift.hours !== undefined && !isNaN(shift.hours)) ? shift.hours : 0;
    const minutes = (shift.minutes !== undefined && !isNaN(shift.minutes)) ? shift.minutes : 0;

    shifts.set(dateKey, {
      ...shift,
      hours,
      minutes,
    });
  });

  const teamShifts = serialized.teamShifts?.map((teamData: any) => {
    const teamShiftsMap = new Map<string, Shift>();
    teamData.shifts.forEach(([dateKey, shift]: [string, any]) => {
      const hours = (shift.hours !== undefined && !isNaN(shift.hours)) ? shift.hours : 0;
      const minutes = (shift.minutes !== undefined && !isNaN(shift.minutes)) ? shift.minutes : 0;
      
      teamShiftsMap.set(dateKey, {
        ...shift,
        hours,
        minutes,
      });
    });

    return {
      teamId: teamData.teamId,
      shifts: teamShiftsMap,
    };
  }) ?? [];

  // Десериализация globalSettings с миграцией для старого формата
  const globalSettings = {
    ...serialized.globalSettings,
    baseDate: serialized.globalSettings?.baseDate ? (
      () => {
        const date = new Date(serialized.globalSettings.baseDate);
        return isValidDate(date) ? date : DEFAULT_PATTERN_BASE_DATE;
      }
    )() : DEFAULT_PATTERN_BASE_DATE,
  };

  return {
    startDate: new Date(serialized.startDate),
    shifts,
    monthlySettings: new Map(serialized.monthlySettings),
    globalSettings: globalSettings || { dayShiftColor: "#f59e0b", nightShiftColor: "#4f46e5" },
    globalNotes: serialized.globalNotes || "",
    vacations: Array.isArray(serialized.vacations)
      ? serialized.vacations.map((v: any) => ({
          startDate: new Date(v.startDate),
          days: v.days,
        }))
      : [],
    teamShifts,
  };
}

// Сохранение основных данных расписания
export function saveScheduleData(data: ScheduleData): void {
  const serialized = serializeScheduleData(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
}

// Сохранение изменений Shift для конкретной команды
export function saveTeamShifts(teamId: string, shifts: Map<string, Shift>): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storageKey = TEAM_SHIFTS_STORAGE_KEY(teamId);
    const serializedShifts = Array.from(shifts.entries()).map(([dateKey, shift]) => [dateKey, shift]);
    localStorage.setItem(storageKey, JSON.stringify(serializedShifts));
  }
}

// Загрузка основных данных расписания
export function loadScheduleData(): ScheduleData | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    return deserializeScheduleData(parsed);
  } catch {
    return null;
  }
}

// Загрузка изменений Shift для конкретной команды
  export function loadTeamShifts(teamId: string): Map<string, Shift> | null {
    if (typeof window === 'undefined') return null;
    
    const storageKey = TEAM_SHIFTS_STORAGE_KEY(teamId);
    const data = localStorage.getItem(storageKey);
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      const shiftsMap = new Map<string, Shift>();
      parsed.forEach(([dateKey, shift]: [string, any]) => {
        const hours = (shift.hours !== undefined && !isNaN(shift.hours)) ? shift.hours : 0;
        const minutes = (shift.minutes !== undefined && !isNaN(shift.minutes)) ? shift.minutes : 0;
        shiftsMap.set(dateKey, {
          ...shift,
          hours,
          minutes,
        });
      });
      return shiftsMap;
    } catch {
      return null;
    }
  }
