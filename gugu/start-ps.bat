@echo off
setlocal

TITLE Twitter App (PowerShell)

echo Twitter App is starting with PowerShell...
echo.

REM Check if PowerShell is available
where powershell >nul 2>&1
if %errorlevel% == 0 (
    echo PowerShell found, starting with PowerShell script...
    powershell -ExecutionPolicy Bypass -File "%~dp0start.ps1"
) else (
    echo Error: PowerShell not found
    echo Please make sure PowerShell is installed on your system
    pause
    exit /b 1
)

pause