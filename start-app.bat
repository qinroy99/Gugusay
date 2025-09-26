@echo off
cd /d "%~dp0"


echo Starting server ...
start /b npm run dev > dev.log 2>&1


for /l %%i in (1,1,8) do (
    netstat -ano | findstr /rc:":3000.*LISTEN" >nul
    if not errorlevel 1 goto :ok
    timeout /t 1 /nobreak >nul
)


echo Server failed to start in 8 s.  Last 30 lines of dev.log:
type dev.log | more
pause
exit /b

:ok
echo.
echo Server is ready! Opening browser ...
start http://localhost:3000
exit