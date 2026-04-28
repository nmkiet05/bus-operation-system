@echo off
setlocal EnableDelayedExpansion
:: BOS Port Killer Manager

:menu
cls
echo ============================================
echo      BOS - PORT KILLER MANAGER
echo ============================================
echo.
echo 1. Kill Port 3000 (Frontend)
echo 2. Kill Port 8080 (Backend)
echo 3. Kill Port 5432 (Database)
echo 4. Kill Port 5050 (PgAdmin)
echo 5. Kill Custom Port(s)
echo 6. Exit
echo.
set /p choice=Select an option (1-6): 

if "%choice%"=="1" set PORTS_TO_KILL=3000 & goto kill_ports
if "%choice%"=="2" set PORTS_TO_KILL=8080 & goto kill_ports
if "%choice%"=="3" set PORTS_TO_KILL=5432 & goto kill_ports
if "%choice%"=="4" set PORTS_TO_KILL=5050 & goto kill_ports
if "%choice%"=="5" goto custom_ports
if "%choice%"=="6" exit

:custom_ports
echo.
set /p PORTS_TO_KILL="Enter port numbers (space-separated, e.g. 3000 8080): "
if "%PORTS_TO_KILL%"=="" goto menu
goto kill_ports

:kill_ports
cls
echo ============================================
echo   BOS - KILLING PORTS: %PORTS_TO_KILL%
echo ============================================
echo.

for %%P in (%PORTS_TO_KILL%) do (
    set "process_found=0"
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
        set "process_found=1"
        echo Killing PID %%a on Port %%P...
        taskkill /PID %%a /F >nul 2>&1
    )

    if "!process_found!"=="0" (
        echo Port %%P is not in use.
    ) else (
        echo Done! Port %%P is now free.
    )
    echo --------------------------------------------
)

echo.
pause
goto menu
