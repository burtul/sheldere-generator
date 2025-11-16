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
   npm install --legacy-peer-deps
   \`\`\`
3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

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

## Mobile App Installation

### iOS
1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"

### Android
1. Open the app in Chrome
2. Tap the menu button (three dots)
3. Tap "Install app" or "Add to Home screen"

## Technical Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **State Management**: React Hooks with LocalStorage
- **Icons**: Lucide React
- **Deployment**: Optimized for Vercel

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android

## Tips

- Use the "Auto" button in monthly settings to automatically calculate target hours based on weekdays
- Click on shift days to add notes for special circumstances
- Generate schedule for 3+ years to have plenty of planning time
- The app syncs data instantly to LocalStorage - no manual saving needed

## License

MIT
