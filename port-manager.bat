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
echo   [1] 3000 (Frontend)
echo   [2] 8080 (Backend)
echo   [3] 5432 (Database)
echo   [4] 5050 (PgAdmin)
echo.
echo Type shortcut numbers (1-4) or actual port numbers.
echo Multiple values separated by space (e.g. 1 2 or 3000 8080)
echo Type 0 to Exit.
echo.
set /p input="Enter Port(s): "

if "%input%"=="0" exit /b
if "%input%"=="" goto menu

:: Parse input: map shortcuts 1-4 to real ports, keep others as-is
set "PORTS="
set "input=!input:,= !"
for %%V in (!input!) do (
    if "%%V"=="1" ( set PORTS=!PORTS! 3000
    ) else if "%%V"=="2" ( set PORTS=!PORTS! 8080
    ) else if "%%V"=="3" ( set PORTS=!PORTS! 5432
    ) else if "%%V"=="4" ( set PORTS=!PORTS! 5050
    ) else ( set PORTS=!PORTS! %%V
    )
)

:action_menu
cls
echo ============================================
echo   SELECTED PORTS:!PORTS!
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
        echo [Port %%P] STATUS: IN USE ^(PID: !pid!^)
        if !DO_KILL!==1 (
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
