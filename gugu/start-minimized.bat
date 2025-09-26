@echo off
setlocal

REM Start service in minimized mode
if exist "twitter-app-win.exe" (
    start "Twitter App Server" /min twitter-app-win.exe
) else if exist "app.js" (
    start "Twitter App Server" /min node app.js
) else (
    echo Error: Executable file not found
    echo Please make sure twitter-app-win.exe or app.js exists in current directory
    timeout /t 5 >nul
    exit /b 1
)

exit