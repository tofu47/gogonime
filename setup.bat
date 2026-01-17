@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   GoGo Anime Frontend - Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected: 
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] npm detected:
npm --version
echo.

REM Install dependencies
echo [*] Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   - Start dev server: npm run dev
echo   - Build for production: npm run build
echo   - Preview build: npm run preview
echo.
pause
