# Build Android Script
Write-Host "Starting Android build..." -ForegroundColor Green

# Step 1: Install dependencies
Write-Host "1. Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Build web version
Write-Host "2. Building web version..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building web version" -ForegroundColor Red
    exit 1
}

# Step 3: Sync with Android
Write-Host "3. Syncing with Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error syncing with Android" -ForegroundColor Red
    exit 1
}

# Step 4: Build Android APK
Write-Host "4. Building Android APK..." -ForegroundColor Yellow
cd android
.\gradlew clean
.\gradlew assembleDebug
cd ..

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "APK file: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
} else {
    Write-Host "Android build error" -ForegroundColor Red
}