#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Инициализация Android проекта...\n');

// Check if out directory exists (from next build)
if (!fs.existsSync('out')) {
  console.log('📦 Сборка Next.js приложения...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Initialize Capacitor if not already done
if (!fs.existsSync('android')) {
  console.log('\n📱 Инициализация Capacitor Android...');
  execSync('npx cap add android', { stdio: 'inherit' });
}

console.log('\n🔄 Синхронизация файлов с Android проектом...');
execSync('npx cap sync android', { stdio: 'inherit' });

console.log('\n✅ Готово! Android проект создан в папке android/');
console.log('\n📝 Следующие шаги:');
console.log('   1. Установите Android Studio');
console.log('   2. Откройте папку android/ в Android Studio');
console.log('   3. Дождитесь синхронизации Gradle');
console.log('   4. Запустите приложение на эмуляторе или устройстве');
console.log('\n💡 Или используйте команду: npm run android:open');



