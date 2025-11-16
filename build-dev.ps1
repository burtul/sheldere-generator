# Development Script
Write-Host "Starting development server..." -ForegroundColor Green

# Step 1: Install dependencies
Write-Host "1. Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error installing dependencies" -ForegroundColor Red
    exit 1
}

# Step 2: Start development server
Write-Host "2. Starting development server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Cyan
npm run dev
