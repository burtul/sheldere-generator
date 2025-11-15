#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 Исправление проблем с Gradle и JDK...\n');
console.log('⚠️  ВАЖНО: Закройте Android Studio перед запуском этого скрипта!\n');

const platform = os.platform();
const androidDir = path.join(process.cwd(), 'android');

if (!fs.existsSync(androidDir)) {
  console.log('❌ Папка android/ не найдена. Запустите сначала: npm run android:init');
  process.exit(1);
}

console.log('1. Очистка кэша Gradle...');
try {
  // Очистка локального кэша Gradle
  const gradleCache = path.join(os.homedir(), '.gradle', 'caches');
  if (fs.existsSync(gradleCache)) {
    console.log('   Очистка:', gradleCache);
    // Не удаляем полностью, только проблемные папки
    const transformsDir = path.join(gradleCache, 'transforms-3');
    if (fs.existsSync(transformsDir)) {
      console.log('   Удаление поврежденных трансформ...');
      try {
        if (platform === 'win32') {
          // Используем PowerShell для надежного удаления
          execSync(`powershell -Command "if (Test-Path '${transformsDir}') { Remove-Item -Recurse -Force '${transformsDir}' }"`, { stdio: 'inherit' });
        } else {
          execSync(`rm -rf "${transformsDir}"`, { stdio: 'inherit' });
        }
        console.log('   ✅ Кэш трансформ очищен');
      } catch (e) {
        console.log('   ⚠️  Не удалось удалить трансформы (может быть занято)');
        console.log('   💡 Закройте Android Studio и попробуйте снова');
      }
    }
  }
} catch (e) {
  console.log('   ⚠️  Ошибка при очистке кэша:', e.message);
}

console.log('\n2. Очистка build папок проекта...');
try {
  process.chdir(androidDir);
  if (platform === 'win32') {
    execSync('gradlew.bat clean', { stdio: 'inherit' });
  } else {
    execSync('./gradlew clean', { stdio: 'inherit' });
  }
} catch (e) {
  console.log('   ⚠️  Ошибка при очистке проекта:', e.message);
}

console.log('\n3. Остановка Gradle daemon...');
try {
  if (platform === 'win32') {
    execSync('gradlew.bat --stop', { stdio: 'inherit', cwd: androidDir });
  } else {
    execSync('./gradlew --stop', { stdio: 'inherit', cwd: androidDir });
  }
} catch (e) {
  console.log('   ⚠️  Ошибка при остановке daemon:', e.message);
}

console.log('\n✅ Очистка завершена!');
console.log('\n📝 Следующие шаги:');
console.log('   1. Убедитесь, что Java JDK 17 установлен и JAVA_HOME настроен');
console.log('   2. В Android Studio: File → Invalidate Caches → Invalidate and Restart');
console.log('   3. В Android Studio: File → Settings → Build → Build Tools → Gradle');
console.log('      Убедитесь, что используется правильный JDK (JDK 17)');
console.log('   4. Попробуйте снова собрать проект');

