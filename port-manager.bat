@echo off
setlocal EnableDelayedExpansion
:: BOS Port Manager

:menu
cls
echo ============================================
echo        BOS - PORT MANAGER
echo ============================================
echo.
echo 1. Port 3000 (Frontend)
echo 2. Port 8080 (Backend)
echo 3. Port 5432 (Database)
echo 4. Port 5050 (PgAdmin)
echo 5. Custom Port
echo 6. Exit
echo.
set /p choices="Select ports by number (space-separated, e.g. 1 2): "
if "%choices%"=="" goto menu
if "%choices%"=="6" exit

set TARGET_PORTS=
for %%C in (%choices%) do (
    if "%%C"=="1" set TARGET_PORTS=!TARGET_PORTS! 3000
    if "%%C"=="2" set TARGET_PORTS=!TARGET_PORTS! 8080
    if "%%C"=="3" set TARGET_PORTS=!TARGET_PORTS! 5432
    if "%%C"=="4" set TARGET_PORTS=!TARGET_PORTS! 5050
    if "%%C"=="5" (
        set /p custom="Enter custom port: "
        set TARGET_PORTS=!TARGET_PORTS! !custom!
    )
)

if "!TARGET_PORTS!"=="" (
    echo [ERROR] Invalid selection!
    pause
    goto menu
)

:action_menu
echo.
echo Selected Ports:!TARGET_PORTS!
echo.
echo What do you want to do?
echo 1. Check Status (View PID)
echo 2. Kill Processes (Free Port)
echo 3. Cancel / Back to Menu
echo.
set /p ACTION="Select action (1-3): "

if "%ACTION%"=="1" goto check_ports
if "%ACTION%"=="2" goto kill_ports
if "%ACTION%"=="3" goto menu
goto action_menu

:check_ports
cls
echo ============================================
echo   BOS - CHECKING PORTS:!TARGET_PORTS!
echo ============================================
echo.

for %%P in (!TARGET_PORTS!) do (
    set "process_found=0"
    echo [Port %%P]
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
        set "process_found=1"
        echo   - Status: IN USE (Listening)
        echo   - PID   : %%a
    )

    if "!process_found!"=="0" (
        echo   - Status: FREE (Not in use)
    )
    echo --------------------------------------------
)
echo.
pause
goto menu

:kill_ports
cls
echo ============================================
echo   BOS - KILLING PORTS:!TARGET_PORTS!
echo ============================================
echo.

for %%P in (!TARGET_PORTS!) do (
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
