// Базовые праздничные дни Беларуси (без года для повторяемости)
import type { Holiday } from "@/lib/types";

interface BaseHoliday {
  name: string;
  type: "national" | "regional" | "religious" | "custom";
  isRecurring: boolean;
  description?: string;
  month: number;
  day: number;
}

interface DynamicHoliday {
  name: string;
  type: "national" | "regional" | "religious" | "custom";
  isRecurring: boolean;
  isWorkHoliday?: boolean;
  description?: string;
  calculateDate: (year: number) => { month: number; day: number };
}

const baseHolidays: BaseHoliday[] = [
  {
    name: "Новы год",
    type: "national",
    isRecurring: true,
    description: "Свята Новага года",
    month: 1,
    day: 1
  },
  {
    name: "Новы год",
    type: "national",
    isRecurring: true,
    description: "Свята Новага года",
    month: 1,
    day: 2
  },
  {
    name: "Нараджэнне Хрыстова",
    type: "religious",
    isRecurring: true,
    description: "Праваслаўнае Нараджэнне",
    month: 1,
    day: 7
  },
  {
    name: "Міжнародны жанчынскі дзень",
    type: "national",
    isRecurring: true,
    description: "Свята жанчын",
    month: 3,
    day: 8
  },
  {
    name: "Дзень працы",
    type: "national",
    isRecurring: true,
    description: "Свята вясны і працы",
    month: 5,
    day: 1
  },
  {
    name: "Дзень Перамогі",
    type: "national",
    isRecurring: true,
    description: "Перамога ў Вялікай Айчыннай вайне",
    month: 5,
    day: 9
  },
  {
    name: "Дзень Незалежнасці",
    type: "national",
    isRecurring: true,
    description: "Галоўнае дзяржаўнае свята Беларусі",
    month: 7,
    day: 3
  },
  {
    name: "Дзень Кастрычніцкай рэвалюцыі",
    type: "national",
    isRecurring: true,
    description: "Гістарычнае свята рэвалюцыі",
    month: 11,
    day: 7
  },
  {
    name: "Каляды",
    type: "religious",
    isRecurring: true,
    description: "Каталіцкае Нараджэнне Хрыстова",
    month: 12,
    day: 25
  }
];

// --- Утилиты для точного расчёта православной Пасхи и Радуницы ---

// Нормализованный модуль (возвращает 0..n-1)
const mod = (x: number, n: number): number => ((x % n) + n) % n;

// Вычисление юлианской Пасхи (YMD) по классической формуле
const calculateJulianEasterYMD = (year: number): { year: number; month: number; day: number } => {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;

  // d = (19*c + 15) mod 30
  const d = mod(19 * c + 15, 30);

  // e = (2*a + 4*b - d + 34) mod 7
  const e = mod(2 * a + 4 * b - d + 34, 7);

  // Позиция в марте/апреле по юлианскому календарю
  const month = Math.floor((d + e + 114) / 31); // 3 = март, 4 = апрель
  const day = ((d + e + 114) % 31) + 1;

  return { year, month, day };
};

// Смещение между юлианским и григорианским календарями для данного года
const julianToGregorianDelta = (year: number): number => {
  // Формула: floor(year/100) - floor(year/400) - 2
  return Math.floor(year / 100) - Math.floor(year / 400) - 2;
};

// Конвертация юлианской YMD в объект Date григорианского календаря
const julianYmdToGregorianDate = (ymd: { year: number; month: number; day: number }): Date => {
  const { year, month, day } = ymd;
  // Создаём JS Date как будто это григорианская дата с теми же числами
  const base = new Date(year, month - 1, day);
  const delta = julianToGregorianDelta(year);
  const greg = new Date(base);
  greg.setDate(base.getDate() + delta);
  return greg;
};

// Полная функция: православная Пасха в григорианском календаре
const calculateOrthodoxEasterGregorian = (year: number): Date => {
  const julian = calculateJulianEasterYMD(year);
  return julianYmdToGregorianDate(julian);
};

// Радуница = Пасха + 9 дней
const calculateRadunicaGregorian = (year: number): Date => {
  const easter = calculateOrthodoxEasterGregorian(year);
  const rad = new Date(easter);
  rad.setDate(easter.getDate() + 9);
  return rad;
};

// --- Динамические праздники, даты которых рассчитываются по формулам ---
const dynamicHolidays: DynamicHoliday[] = [
  {
    name: "Радуніца",
    type: "religious",
    isRecurring: true,
    description: "Праваслаўнае памінанне памерлых",
    calculateDate: (year: number) => {
      const rad = calculateRadunicaGregorian(year);
      return {
        month: rad.getMonth() + 1,
        day: rad.getDate()
      };
    }
  },
   {
    name: "Дзень работнікаў нафтавой, газавай і паліўнай прамысловасці",
    type: "regional",
    isRecurring: true,
    isWorkHoliday: true, // Это рабочий праздник
    description: "Прафесійнае свята работнікаў нафтавой, газавай і паліўнай прамысловасці Беларусі",
    calculateDate: (year: number) => {
      // Празднуется в первое воскресенье сентября
      const septemberFirst = new Date(year, 8, 1); // 8 - это сентябрь (0-индексация)
      const dayOfWeek = septemberFirst.getDay(); // 0 - воскресенье, 1 - понедельник, ..., 6 - суббота

      // Если 1 сентября уже воскресенье, то дата - 1 сентября
      // Иначе находим следующее воскресенье
      const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const holidayDate = new Date(septemberFirst);
      holidayDate.setDate(septemberFirst.getDate() + daysToAdd);

      return {
        month: holidayDate.getMonth() + 1,
        day: holidayDate.getDate()
      };
    }
  }
];

// Функция для нормализации id (безопасная для кириллицы и спецсимволов)
const normalizeId = (name: string): string =>
  encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"));

// Функция для генерации праздников на конкретный год
export const generateHolidaysForYear = (year: number): Holiday[] => {
  const holidays: Holiday[] = [];

  // Добавляем статические праздники
  holidays.push(
    ...baseHolidays.map((holiday) => ({
      id: `${normalizeId(holiday.name)}-${year}-${holiday.month}-${holiday.day}`,
      name: holiday.name,
      date: `${year}-${String(holiday.month).padStart(2, "0")}-${String(holiday.day).padStart(2, "0")}`,
      type: holiday.type,
      isRecurring: holiday.isRecurring,
      description: holiday.description
    }))
  );

   // Добавляем динамические праздники
   holidays.push(
     ...dynamicHolidays.map((holiday) => {
       const { month, day } = holiday.calculateDate(year);
       return {
         id: `${normalizeId(holiday.name)}-${year}-${month}-${day}`,
         name: holiday.name,
         date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
         type: holiday.type,
         isRecurring: holiday.isRecurring,
         isWorkHoliday: holiday.isWorkHoliday,
         description: holiday.description
       };
     })
   );

  return holidays;
};

// Генерация праздников для указанного диапазона лет
export const getHolidaysForYears = (startYear: number, count: number = 5): Holiday[] => {
  const holidays: Holiday[] = [];
  for (let year = startYear; year < startYear + count; year++) {
    holidays.push(...generateHolidaysForYear(year));
  }
  return holidays;
};

// Пример: генерация праздников для текущего года и 9 соседних лет (10 лет)
const currentYear = new Date().getFullYear();

export const exampleHolidays: Holiday[] = getHolidaysForYears(currentYear - 5, 10);
