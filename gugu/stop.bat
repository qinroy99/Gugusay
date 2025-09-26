@echo off
setlocal

TITLE Twitter App Stop Service

echo Stopping Twitter App service...

REM Find and terminate Twitter App related processes
echo Looking for Twitter App processes...

set found_process=0

REM Find twitter-app-win.exe process
tasklist | findstr /i "twitter-app-win.exe" >nul
if %errorlevel% == 0 (
    echo Terminating twitter-app-win.exe process...
    taskkill /f /im "twitter-app-win.exe"
    set found_process=1
)

REM Find Twitter App process started with node.js
tasklist /fi "imagename eq node.exe" /fo csv | findstr "app.js" >nul
if %errorlevel% == 0 (
    echo Looking for Node.js Twitter App process...
    for /f "tokens=2 delims=," %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr "app.js"') do (
        echo Terminating Node.js process with PID %%i...
        taskkill /f /pid %%i
        set found_process=1
    )
)

if %found_process% == 0 (
    echo No running Twitter App processes found
) else (
    echo Twitter App service has been stopped
)

echo.
pause