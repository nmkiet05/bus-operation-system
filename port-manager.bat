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
set /p choices="Select ports to check by number (space-separated, e.g. 1 2): "
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

cls
echo ============================================
echo   BOS - CHECKING PORTS: !TARGET_PORTS!
echo ============================================
echo.

for %%P in (!TARGET_PORTS!) do (
    set "process_found=0"
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
        set "process_found=1"
        set "pid=%%a"
    )

    if "!process_found!"=="0" (
        echo [Port %%P] STATUS: FREE
        echo   - Safe to start the system. No conflicts.
        echo --------------------------------------------
    ) else (
        echo [Port %%P] STATUS: IN USE ^(PID: !pid!^)
        echo   [WARNING] This port is currently busy!
        echo   [WARNING] Starting the system now will cause a "Port Conflict" error.
        
        set /p kill_choice="Do you want to KILL this process to free the port? [Y/N]: "
        if /I "!kill_choice!"=="Y" (
            echo Killing PID !pid! on Port %%P...
            taskkill /PID !pid! /F >nul 2>&1
            echo Done! Port %%P is now FREE.
        ) else (
            echo Skipped. Port %%P is still IN USE.
        )
        echo --------------------------------------------
    )
)

echo.
pause
goto menu
