# Документация по архитектуре и API

## Обзор архитектуры

Приложение "Shift Schedule Manager" построено на современном стеке технологий с использованием лучших практик разработки.

### Технологический стек

- **Фронтенд**: Next.js 16.1.1 с React 19.2.0
- **Язык**: TypeScript
- **Стилизация**: Tailwind CSS с Radix UI компонентами
- **Состояние**: Локальное состояние с useState (планируется миграция на Zustand)
- **Хранилище**: LocalStorage (планируется миграция на IndexedDB)
- **Мобильная поддержка**: Capacitor для Android/iOS
- **Офлайн работа**: Service Worker и LocalStorage

### Основные компоненты

```
src/
├── app/                  # Основные страницы
├── components/           # UI компоненты
├── lib/                  # Бизнес-логика и утилиты
├── hooks/                # Кастомные хуки
├── types/                # TypeScript типы
├── styles/               # Глобальные стили
└── public/               # Статические ресурсы
```

## Архитектура данных

### Структура данных

Основная структура данных приложения определена в `lib/types.ts`:

```typescript
// Основные типы
export type ShiftType = "day" | "night" | "night2" | "off" | "offn" | "weekday" | "weekday15" | "weekday7"

// Смена
export interface Shift {
  date: string          // YYYY-MM-DD
  type: ShiftType       // Тип смены
  hours: number         // Часы
  minutes: number       // Минуты
  notes?: string        // Заметки
  notifications?: Notification[] // Уведомления
}

// Настройки месяца
export interface MonthlySettings {
  month: string         // YYYY-MM
  targetHours: number   // Целевые часы
}

// Глобальные настройки
export interface GlobalSettings {
  dayShiftColor: string
  nightShiftColor: string
  offShiftColor: string
  customNumber?: number
}

// Основные данные приложения
export interface ScheduleData {
  startDate: Date
  shifts: Map<string, Shift>
  monthlySettings: Map<string, MonthlySettings>
  globalSettings: GlobalSettings
  globalNotes?: string
}
```

### Поток данных

1. **Загрузка данных**: При запуске приложения данные загружаются из LocalStorage через `loadScheduleData()`
2. **Управление состоянием**: Данные хранятся в состоянии компонента и обновляются через setState
3. **Сохранение данных**: При изменении данных они автоматически сохраняются в LocalStorage через `saveScheduleData()`
4. **Обработка данных**: Бизнес-логика для работы с данными находится в `lib/schedule-utils.ts`

## Основные API и функции

### Хранилище данных

**Функции в `lib/storage.ts`:**

```typescript
// Загрузка данных
function loadScheduleData(): ScheduleData | null

// Сохранение данных
function saveScheduleData(data: ScheduleData): void
```

### Генерация графиков

**Функции в `lib/schedule-utils.ts`:**

```typescript
// Генерация основного графика
export function generateSchedule(
  startDate: Date,
  daysAhead = 365,
  team: keyof typeof TEAM_PATTERNS = "Бригада 1"
): Map<string, Shift>

// Генерация 5-дневного графика
export function generate5DaySchedule(
  startDate: Date,
  daysAhead = 365
): Map<string, Shift>

// Генерация 5-дневного графика с 8 часами 15 минут
export function generate5DaySchedule15(
  startDate: Date,
  daysAhead = 365
): Map<string, Shift>

// Подсчет часов в месяце
export function getMonthHours(
  shifts: Map<string, Shift>,
  year: number,
  month: number
): number

// Подсчет рабочих дней в месяце
export function getWorkDaysInMonth(year: number, month: number): number
```

### Основные компоненты

**Главный компонент: `app/page.tsx`**

Основной компонент Dashboard управляет всем состоянием приложения и координирует взаимодействие между компонентами.

**Основные функции:**
- Управление состоянием графика
- Обработка действий пользователя
- Координация между компонентами

**Ключевые компоненты:**

1. **ShiftCalendar** - Основной календарь с отображением смен
2. **ShiftEditor** - Редактор отдельной смены
3. **MonthSummary** - Отображение статистики по месяцу
4. **BurgerMenu** - Основное меню с настройками
5. **TeamSelector** - Выбор бригады/типа графика

## Паттерны и лучшие практики

### Управление состоянием

Текущая реализация использует локальное состояние с useState, но планируется миграция на более продвинутые решения:

```typescript
// Текущая реализация
const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)

// Планируемая реализация с Zustand
const useScheduleStore = create<ScheduleStore>()((set) => ({
  scheduleData: null,
  setScheduleData: (data) => set({ scheduleData: data }),
  // ... другие действия
}))
```

### Работа с данными

Для работы с данными рекомендуется использовать следующие паттерны:

1. **Иммутабельность**: Всегда создавать новые объекты вместо мутации существующих
2. **Оптимизация**: Использовать Map для быстрого доступа к данным по дате
3. **Типизация**: Всегда использовать TypeScript типы для безопасности

### Производительность

Рекомендации по оптимизации производительности:

1. **Мемоизация**: Использовать useMemo для тяжелых вычислений
2. **Виртуализация**: Для больших списков использовать виртуализацию
3. **Ленивая загрузка**: Разделять код на чанки для ленивой загрузки
4. **Оптимизация рендеринга**: Использовать React.memo для предотвращения ненужных ре-рендеров

## Интеграция с внешними системами

### Capacitor для мобильных приложений

Приложение использует Capacitor для создания мобильных версий:

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.example.shiftschedule',
  appName: 'Shift Schedule',
  webDir: 'out',
  bundledWebRuntime: false
}

export default config
```

### Service Worker для офлайн работы

Приложение регистрирует Service Worker для офлайн функциональности:

```typescript
// В основном компоненте
useEffect(() => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  }
}, [])
```

## План миграции на новую архитектуру

### Этап 1: Внедрение Zustand

1. Установка и настройка Zustand
2. Создание основного хранилища
3. Миграция состояния из компонентов
4. Тестирование и оптимизация

### Этап 2: Миграция на IndexedDB

1. Создание обертки для IndexedDB
2. Миграция данных из LocalStorage
3. Оптимизация работы с данными
4. Тестирование производительности

### Этап 3: Рефакторинг компонентов

1. Выделение бизнес-логики в сервисы
2. Оптимизация компонентов
3. Добавление тестов
4. Документация API

### Этап 4: Внедрение тестирования

1. Настройка тестового окружения
2. Написание модульных тестов
3. Добавление интеграционных тестов
4. Настройка CI/CD для тестирования

## Рекомендации по разработке

1. **Типизация**: Всегда использовать TypeScript для безопасности типов
2. **Документация**: Документировать все новые функции и компоненты
3. **Тестирование**: Писать тесты для новой функциональности
4. **Производительность**: Оптимизировать тяжелые операции
5. **Совместимость**: Проверять изменения на разных устройствах

## API для внешней интеграции

Планируется создание API для интеграции с внешними системами:

```typescript
// Планируемое API
interface ShiftScheduleAPI {
  // Получение данных графика
  getScheduleData(): Promise<ScheduleData>

  // Обновление графика
  updateSchedule(data: Partial<ScheduleData>): Promise<void>

  // Генерация нового графика
  generateSchedule(options: GenerateOptions): Promise<Map<string, Shift>>

  // Экспорт данных
  exportData(format: 'json' | 'csv' | 'pdf'): Promise<Blob>

  // Импорт данных
  importData(data: any, format: 'json' | 'csv'): Promise<void>
}
```

## Документация для разработчиков

Для новых разработчиков рекомендуется:

1. Изучить структуру проекта и основные компоненты
2. Ознакомиться с TypeScript типами и интерфейсами
3. Понимать поток данных в приложении
4. Следовать существующим паттернам кода
5. Писать тесты для новой функциональности

## Следующие шаги

1. Создать детальную документацию для каждого компонента
2. Документировать все публичные API и функции
3. Создать руководство по добавлению новых функций
4. Документировать процесс сборки и развертывания
5. Создать руководство по тестированию и отладке