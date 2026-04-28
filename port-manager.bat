@echo off
setlocal EnableDelayedExpansion
title BOS Port Manager

:menu
cls
echo ============================================
echo             BOS - PORT MANAGER
echo ============================================
echo.
echo Recommended Ports:
echo   - 3000 (Frontend)
echo   - 8080 (Backend)
echo   - 5432 (Database)
echo   - 5050 (PgAdmin)
echo.
echo Type the port number(s) you want to manage.
echo (You can type multiple ports, e.g: 3000 8080)
echo Or type 0 to Exit.
echo.
set /p PORTS="Enter Port(s): "

if "%PORTS%"=="0" exit /b
if "%PORTS%"=="" goto menu

:: Normalize commas to spaces just in case
set "PORTS=!PORTS:,= !"

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
