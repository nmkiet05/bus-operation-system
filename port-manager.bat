@echo off
setlocal EnableDelayedExpansion
:: BOS Port Manager

:menu
cls
echo ============================================
echo        BOS - PORT MANAGER
echo ============================================
echo.
echo Common Ports: 3000 (Frontend), 8080 (Backend), 5432 (DB), 5050 (PgAdmin)
echo.
set /p TARGET_PORTS="Enter port numbers directly (e.g. 3000,8080) or leave blank to exit: "
if "%TARGET_PORTS%"=="" exit

:: Replace commas with spaces so the loop works perfectly
set TARGET_PORTS=!TARGET_PORTS:,= !

cls
echo ============================================
echo   BOS - CHECKING PORTS: !TARGET_PORTS!
echo ============================================
echo.

for %%P in (!TARGET_PORTS!) do (
    set "process_found=0"
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr ":%%P "') do (
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
