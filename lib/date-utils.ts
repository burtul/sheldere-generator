/**
 * Форматирование даты в формате YYYY-MM-DD для отображения (ru-RU).
 */
export function formatDateString(dateStr: string | null): string | null {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString("ru-RU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
