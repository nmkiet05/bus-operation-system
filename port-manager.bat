@echo off
setlocal EnableDelayedExpansion
title BOS Port Manager

:menu
cls
echo ============================================
echo             BOS - PORT MANAGER
echo ============================================
echo.
echo 1. Port 3000 (Frontend)
echo 2. Port 8080 (Backend)
echo 3. Port 5432 (Database)
echo 4. Port 5050 (PgAdmin)
echo 5. Custom Port
echo 0. Exit
echo.
set /p choices="Select ports by number (e.g. 1 2): "

if "%choices%"=="0" exit /b
if "%choices%"=="" goto menu

:: Parse choices to port numbers
set "PORTS="
set "choices=!choices:,= !"
for %%C in (!choices!) do (
    if "%%C"=="1" set PORTS=!PORTS! 3000
    if "%%C"=="2" set PORTS=!PORTS! 8080
    if "%%C"=="3" set PORTS=!PORTS! 5432
    if "%%C"=="4" set PORTS=!PORTS! 5050
    if "%%C"=="5" (
        set /p custom="Enter custom port number: "
        set PORTS=!PORTS! !custom!
    )
)

if "!PORTS!"=="" (
    echo [ERROR] Invalid selection!
    pause
    goto menu
)

:action_menu
cls
echo ============================================
echo   SELECTED PORTS: !PORTS!
echo ============================================
echo.
echo 1. CHECK port status
echo 2. KILL processes on these ports
echo 3. Back to main menu
echo 0. Exit
echo.
set /p ACTION="What do you want to do? (0-3): "

if "%ACTION%"=="0" exit /b
if "%ACTION%"=="3" goto menu
if "%ACTION%"=="1" (
    set DO_CHECK=1
    set DO_KILL=0
    goto execute
)
if "%ACTION%"=="2" (
    set DO_CHECK=0
    set DO_KILL=1
    goto execute
)
goto action_menu

:execute
cls
echo ============================================
if !DO_CHECK!==1 echo   CHECKING PORTS...
if !DO_KILL!==1 echo   KILLING PORTS...
echo ============================================
echo.

for %%P in (!PORTS!) do (
    set "process_found=0"
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr ":%%P "') do (
        set "process_found=1"
        set "pid=%%a"
    )

    if "!process_found!"=="0" (
        echo [Port %%P] STATUS: FREE ^(Not in use^)
    ) else (
        if !DO_CHECK!==1 (
            echo [Port %%P] STATUS: IN USE ^(PID: !pid!^)
        )
        if !DO_KILL!==1 (
            echo [Port %%P] STATUS: IN USE ^(PID: !pid!^)
            echo [Port %%P] ACTION: Killing process...
            taskkill /PID !pid! /F >nul 2>&1
            echo [Port %%P] RESULT: Port is now FREE!
        )
    )
    echo --------------------------------------------
)

echo.
pause
goto menu
