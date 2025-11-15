#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

console.log('🔍 Проверка требований для Android разработки...\n');

let allOk = true;

// Check Node.js
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
  if (majorVersion >= 18) {
    console.log(`✅ Node.js: ${nodeVersion}`);
  } else {
    console.log(`❌ Node.js: ${nodeVersion} (требуется версия 18+)`);
    allOk = false;
  }
} catch (e) {
  console.log('❌ Node.js: не установлен');
  allOk = false;
}

// Check Java
try {
  const javaVersion = execSync('java -version', { encoding: 'utf-8', stdio: 'pipe' }).trim();
  if (javaVersion.includes('version')) {
    console.log(`✅ Java: установлен`);
  } else {
    console.log(`❌ Java: не установлен или не в PATH`);
    allOk = false;
  }
} catch (e) {
  console.log('❌ Java: не установлен (требуется JDK 17+)');
  console.log('   Скачать: https://adoptium.net/');
  allOk = false;
}

// Check Android SDK
const platform = os.platform();
let androidHome = '';

if (platform === 'win32') {
  androidHome = process.env.ANDROID_HOME || process.env.LOCALAPPDATA + '\\Android\\Sdk';
} else if (platform === 'darwin') {
  androidHome = process.env.ANDROID_HOME || process.env.HOME + '/Library/Android/sdk';
} else {
  androidHome = process.env.ANDROID_HOME || process.env.HOME + '/Android/Sdk';
}

if (fs.existsSync(androidHome)) {
  console.log(`✅ Android SDK: найден в ${androidHome}`);
} else {
  console.log(`⚠️  Android SDK: не найден`);
  console.log(`   Установите Android Studio: https://developer.android.com/studio`);
  console.log(`   Или установите переменную ANDROID_HOME`);
  allOk = false;
}

// Check if Capacitor is installed
try {
  const capacitorVersion = execSync('npx cap --version', { encoding: 'utf-8' }).trim();
  console.log(`✅ Capacitor CLI: доступен`);
} catch (e) {
  console.log(`⚠️  Capacitor: не установлен (будет установлен при npm install)`);
}

console.log('\n' + '='.repeat(50));
if (allOk) {
  console.log('✅ Все основные требования выполнены!');
  console.log('\nСледующий шаг: npm run android:init');
} else {
  console.log('❌ Некоторые требования не выполнены');
  console.log('\nУстановите недостающие компоненты и повторите проверку');
}
console.log('='.repeat(50));



