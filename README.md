# Shift Schedule Manager

A modern web application for managing 2/2 shift rotations with automatic schedule generation, monthly hour tracking, and offline support.

## Features

- **2/2 Schedule Generator**: Automatically generates 3-year shift schedules with the pattern: Day (12h) → Day (12h) → Night (12h) → Night (12h) → Off → Off
- **Interactive Calendar**: Visual monthly calendar with color-coded shifts and quick editing
- **Monthly Norms Tracking**: Set target hours per month and track progress automatically
- **Customizable Colors**: Choose colors for day and night shifts per month
- **Shift Notes**: Add notes to any shift for tracking special events or reminders
- **Mobile Responsive**: Fully optimized for mobile devices with touch-friendly interface
- **Offline Support**: Works offline with LocalStorage persistence and service worker
- **PWA Ready**: Install as a native app on desktop and mobile devices

## Getting Started

### Installation

1. Clone or download this project
2. Install dependencies:
   \`\`\`bash
  npm install  --legacy-peer-deps
   \`\`\`
3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open [http://localhost:3000](http://localhost:3000) in your browser


5. 🔄 1. Обновление иконки средствами Android Studio
   Если ты хочешь заменить иконку вручную:

Открой Android Studio → android/app/src/main/res.

Найди папки mipmap-hdpi, mipmap-mdpi, mipmap-xhdpi, mipmap-xxhdpi, mipmap-xxxhdpi.

Замени файлы ic_launcher.png и ic_launcher_round.png на свои.

Убедись, что в AndroidManifest.xml прописано:

xml
android:icon="@mipmap/ic_launcher"
android:roundIcon="@mipmap/ic_launcher_round"
🧼 2. Очистка и синхронизация
После замены иконок:c

     npx cap sync android

Это не перезапишет папку android/, а просто синхронизирует изменения из capacitor.config.ts и www/.

🧠 Резюме
Действие	                                Безопасно?	Комментарий
npx cap add android повторно	            ❌ Нет	Может перезаписать существующую папку
npx cap sync android	                    ✅ Да	Обновляет конфигурацию и ресурсы
Замена иконок вручную в Android Studio	    ✅ Да	Надёжный способ, особенно для Android 12+
Использование capacitor-assets	        ✅ Да	Можно, если хочешь автоматическую генерацию

*************************************************************************

                        Создание апк из react

npm install  --legacy-peer-deps
npm run build

## 📦 Сборка веб-версии

### Интерактивная сборка
[🚀 Нажмите здесь для сборки веб-версии](build.html) - откроется страница с кнопкой сборки

### Ручная сборка (для разработчиков)
```bash
# Установка зависимостей
npm install --legacy-peer-deps

# Сборка проекта
npm run build
✅ Подготовка перед сборкой
bash
# Убедись, что все изменения синхронизированы
npx cap sync android

# Очисти временные файлы, не трогая иконки и исходники
cd android
./gradlew clean

🧱 Сборка APK через терминал
./gradlew assembleDebug

# android/app/build/outputs/apk/debug/app-debug.apk

*****************************************************************


🧱 Сборка APK через терминал
bash
cd android
./gradlew assembleDebug      # для отладочной сборки
./gradlew assembleRelease    # для релизной ссвборки
Debug APK: не требует подписи, можно сразу установить на устройство.

Release APK: требует ключ подписи (если не настроен — Android Studio предложит создать).

📦 Где найти APK
После сборки APK будет в:

Код
android/app/build/outputs/apk/debug/app-debug.apk
android/app/build/outputs/apk/release/app-release.apk
🧪 Установка на устройство
bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
(Устройство должно быть подключено и режим разработчика включён)

🧠 Советы
Не запускай npx cap add android повторно — это может перезаписать папку android/.

Не трогай capacitor.config.ts вручную, если не уверен — изменения могут повлиять на сборку.

Иконки и splash останутся нетронутыми, если ты не запускаешь генератор ресурсов (capacitor-assets generate) заново.

### Deploy в vercel
    🧰 1. Установка CLI
   Установи Vercel CLI глобально:

bash
npm install -g vercel
Проверь, что всё установилось:

bash
vercel --version
🔐 2. Авторизация
Выполни вход в Vercel:

bash
vercel login
Введи email, на который зарегистрирован аккаунт Vercel. Подтверди вход через письмо.

📁 3. Переход в папку проекта
Перейди в директорию с проектом:

bash
cd путь/к/твоему/проекту
Убедись, что там есть package.json, .vercelignore (если нужно), и проект готов к сборке.

🚀 4. Деплой
Запусти команду:

bash
vercel
CLI задаст вопросы:

"Set up and deploy?" — ответь Y

"Which scope?" — выбери аккаунт или организацию

"Link to existing project?" — если уже есть проект на Vercel, можно привязать

"What's your project's root directory?" — обычно ./

"Framework?" — Vercel сам определит, но можно указать вручную (например, Next.js)

"Build command?" — например, npm run build

"Output directory?" — например, .next, dist, build

После этого начнётся деплой, и ты получишь ссылку вида:

Код
https://your-project-name.vercel.app
🔁 5. Повторный деплой
Если проект уже привязан, просто запускай:

bash
vercel --prod
Это задеплоит в production без лишних вопросов.

🛠 Дополнительные команды
Команда	Описание
vercel dev	Локальный запуск с эмуляцией Vercel
vercel env add	Добавление переменных окружения
vercel logs	Просмотр логов деплоя
vercel --prod	Деплой в production
vercel --prebuilt	Деплой уже собранного проекта

### Building for Production

\`\`\`bash
npm run build
npm run start
\`\`\`

## Usage

### Generate Schedule
1. Click "Generate Schedule" panel on the right
2. Select your start date
3. Choose which shift to start with
4. Set the number of years to generate
5. Click "Generate Schedule"

### Edit Shifts
1. Click on any date in the calendar
2. A shift editor modal will open
3. Change shift type (Day/Night/Off) or hours worked
4. Add optional notes
5. Click "Save"

### Monthly Settings
1. Click "Settings" button on any month
2. Choose colors for day and night shifts
3. Set target hours for the month or use "Auto" to calculate based on workdays
4. Click "Save Settings"

### View Progress
- Monthly progress cards show hours worked vs. target
- Visual progress bar indicates completion
- Status icons show if you're on track

## Data Storage

All data is stored locally in your browser using LocalStorage. Your schedule is automatically saved whenever you make changes and will persist even if you close and reopen the app.

## Offline Usage

The app works completely offline once loaded. All schedule data is stored locally, and the service worker ensures the app loads even without internet connection.

## Android App

Приложение можно собрать как нативное Android приложение с помощью Capacitor.

### Быстрый старт

1. Установите зависимости:
   ```bash
   npm install  --legacy-peer-deps
   ```

2. Инициализируйте Android проект:
   ```bash
   npm run android:init
   ```

3. Откройте проект в Android Studio:
   ```bash
   npm run android:open
   ```

4. Запустите приложение на эмуляторе или устройстве

### Подробные инструкции

См. [ANDROID_SETUP.md](./ANDROID_SETUP.md) для полной инструкции по настройке, сборке и публикации Android приложения.

### Команды для Android

- `npm run android:check` - Проверить требования
- `npm run android:init` - Инициализация Android проекта
- `npm run android:build` - Сборка и синхронизация
- `npm run android:open` - Открыть в Android Studio
- `npm run android:sync` - Синхронизировать файлы
- `npm run android:run` - Запустить на устройстве
- `npm run android:fix` - Исправить проблемы с Gradle/JDK

### Решение проблем

Если возникают проблемы с сборкой Android приложения, см.:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Подробное руководство по устранению проблем
- [ANDROID_SETUP.md](./ANDROID_SETUP.md) - Полная инструкция по настройке

****

MIT
## 📦 Сборка проекта

### Интерактивный сборщик
[🚀 Открыть сборщик проектов](build.html) - выберите тип сборки и получите инструкции

### 🔧 Режим разработки
```bash
# Установка зависимостей и запуск dev-сервера
npm install --legacy-peer-deps
npm run dev