::[Bat To Exe Converter]
::
::YAwzoRdxOk+EWAjk
::fBw5plQjdCqDJEmP8w80IQhAcDCVNX+uA6dS4ev0jw==
::YAwzuBVtJxjWCl3EqQJgSA==
::ZR4luwNxJguZRRnk
::Yhs/ulQjdF+5
::cxAkpRVqdFKZSDk=
::cBs/ulQjdF+5
::ZR41oxFsdFKZSDk=
::eBoioBt6dFKZSDk=
::cRo6pxp7LAbNWATEpCI=
::egkzugNsPRvcWATEpCI=
::dAsiuh18IRvcCxnZtBJQ
::cRYluBh/LU+EWAnk
::YxY4rhs+aU+JeA==
::cxY6rQJ7JhzQF1fEqQJQ
::ZQ05rAF9IBncCkqN+0xwdVs0
::ZQ05rAF9IAHYFVzEqQJQ
::eg0/rx1wNQPfEVWB+kM9LVsJDGQ=
::fBEirQZwNQPfEVWB+kM9LVsJDGQ=
::cRolqwZ3JBvQF1fEqQJQ
::dhA7uBVwLU+EWDk=
::YQ03rBFzNR3SWATElA==
::dhAmsQZ3MwfNWATElA==
::ZQ0/vhVqMQ3MEVWAtB9wSA==
::Zg8zqx1/OA3MEVWAtB9wSA==
::dhA7pRFwIByZRRnk
::Zh4grVQjdCqDJEmP8w80IQhAcAOXO373EqIV/Pz+/aSCukh9
::YB416Ek+ZG8=
::
::
::978f952a14a936cc963da21a135fa983
@echo off
setlocal

TITLE Twitter App

echo Twitter App is starting...
echo.

REM Check if executable file exists
if exist "twitter-app-win.exe" (
    echo Starting Twitter App service...
    start "Twitter App Server" /min twitter-app-win.exe
    set APP_TYPE=exe
) else if exist "app.js" (
    echo Starting Twitter App service...
    start "Twitter App Server" /min node app.js
    set APP_TYPE=node
) else (
    echo Error: Executable file not found
    echo Please make sure twitter-app-win.exe or app.js exists in current directory
    pause
    exit /b 1
)

REM Wait for service to start
echo Waiting for service to start...
timeout /t 1 /nobreak >nul

REM Check if port is listening
echo Checking if service is running...
netstat -an | findstr :3000 >nul
if %errorlevel% == 0 (
    echo Service is running, opening browser...
) else (
    echo Warning: Service may still be starting...
)

REM Open browser to access the app
echo Opening browser to http://localhost:3000 ...
start "" http://localhost:3000

echo.
echo Twitter App has been started successfully!
echo If browser does not open automatically, please manually visit http://localhost:3000
echo.
echo Do not close this window, closing it will stop the service
echo.

pause