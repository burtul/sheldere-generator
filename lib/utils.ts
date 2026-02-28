import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Проверяет, является ли значение корректной датой.
 * @param date - Дата или строка в формате ISO/YYYY-MM-DD
 * @returns `true`, если дата валидна, иначе `false`
 */
export const isValidDate = (date: Date | string | undefined | null): boolean => {
  if (!date) return false;
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

/**
 * Проверяет, соответствует ли строка формату YYYY-MM-DD.
 * @param dateString - Строка для проверки
 * @returns `true`, если формат корректен
 */
export const isDateStringValid = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
