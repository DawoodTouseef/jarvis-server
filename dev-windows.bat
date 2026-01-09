@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: Get the directory of the current script
SET "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%" || exit /b

echo ========================================
echo JARVIS DEVELOPMENT SERVER STARTUP
echo ========================================

:: Start the frontend development server in the background
echo Starting frontend development server...
start "Frontend Dev Server" /min cmd /c "npm run dev"

:: Wait a moment for the frontend to start
timeout /t 3 /nobreak >nul

:: Start the backend server
echo Starting backend server...
python start.py

:: If we reach here, the backend has stopped, so we should close the frontend too
echo Stopping development servers...
taskkill /f /im node.exe >nul 2>&1

echo Development servers stopped.