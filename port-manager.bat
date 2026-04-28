@echo off
setlocal EnableDelayedExpansion

if "%~1"=="" goto interactive

:: ==========================================
:: CLI MODE (Arguments provided)
:: ==========================================
set PORTS=
set DO_CHECK=0
set DO_REMOVE=0
set "IS_INTERACTIVE=0"

:: Parse all arguments dynamically
for %%A in (%*) do (
    set "arg=%%A"
    if "!arg:~0,1!"=="-" (
        :: It's a flag
        echo !arg! | findstr /i "c" >nul && set DO_CHECK=1
        echo !arg! | findstr /i "r" >nul && set DO_REMOVE=1
    ) else (
        :: It's a port
        set "clean_port=!arg:,= !"
        set PORTS=!PORTS! !clean_port!
    )
)
goto process_ports

:: ==========================================
:: INTERACTIVE MODE (Double-clicked)
:: ==========================================
:interactive
set "IS_INTERACTIVE=1"
cls
echo ============================================
echo        BOS - PORT MANAGER (Interactive)
echo ============================================
echo.
echo 1. Port 3000 (Frontend)
echo 2. Port 8080 (Backend)
echo 3. Port 5432 (Database)
echo 4. Port 5050 (PgAdmin)
echo 5. Custom Port
echo 6. Exit
echo.
echo Leave blank to show CLI Help Menu.
set /p input_choices="Select ports by number (comma-separated, e.g. 1,2): "

if "%input_choices%"=="" goto help
if "%input_choices%"=="6" exit /b

set "PORTS="
set "input_choices=!input_choices:,= !"
for %%C in (!input_choices!) do (
    if "%%C"=="1" set PORTS=!PORTS! 3000
    if "%%C"=="2" set PORTS=!PORTS! 8080
    if "%%C"=="3" set PORTS=!PORTS! 5432
    if "%%C"=="4" set PORTS=!PORTS! 5050
    if "%%C"=="5" (
        set /p custom="Enter custom port: "
        set PORTS=!PORTS! !custom!
    )
)

if "!PORTS!"=="" (
    echo [ERROR] Invalid selection!
    pause
    goto interactive
)

echo.
echo Selected Ports: !PORTS!
echo Options:
echo  [c]  Check status only
echo  [r]  Remove (Kill) processes
echo.
set /p input_flags="Enter options (default is c): "

set DO_CHECK=0
set DO_REMOVE=0

if "%input_flags%"=="" set DO_CHECK=1
if not "%input_flags%"=="" (
    echo %input_flags% | findstr /i "c" >nul && set DO_CHECK=1
    echo %input_flags% | findstr /i "r" >nul && set DO_REMOVE=1
)
goto process_ports

:: ==========================================
:: EXECUTION ENGINE
:: ==========================================
:process_ports
if !DO_CHECK!==0 if !DO_REMOVE!==0 set DO_CHECK=1

if "!PORTS!"=="" (
    echo [ERROR] No ports specified.
    goto help
)

echo.
echo ============================================
echo   BOS - EXECUTING...
echo ============================================

for %%P in (!PORTS!) do (
    set "process_found=0"
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr ":%%P "') do (
        set "process_found=1"
        set "pid=%%a"
    )

    if "!process_found!"=="0" (
        if !DO_CHECK!==1 (
            echo [Port %%P] STATUS: FREE
        ) else if !DO_REMOVE!==1 (
            echo [Port %%P] STATUS: FREE ^(Nothing to remove^)
        )
    ) else (
        if !DO_CHECK!==1 (
            echo [Port %%P] STATUS: IN USE ^(PID: !pid!^)
        )
        
        if !DO_REMOVE!==1 (
            echo [Port %%P] Action: Killing PID !pid!...
            taskkill /PID !pid! /F >nul 2>&1
            echo [Port %%P] Result: Port is now FREE.
        ) else (
            if !DO_CHECK!==1 (
                echo [Port %%P] Action: Skipped. ^(Run with -r to kill^)
            )
        )
    )
    echo --------------------------------------------
)

if "!IS_INTERACTIVE!"=="1" (
    echo.
    pause
    goto interactive
)
exit /b

:: ==========================================
:: HELP MENU
:: ==========================================
:help
cls
echo ============================================
echo        BOS - PORT MANAGER (CLI Help)
echo ============================================
echo Usage: port-manager.bat [ports] [flags]
echo.
echo Ports: Space or comma-separated list of ports
echo.
echo Flags (Linux-style):
echo   -c   Check port status (Default if no flag provided)
echo   -r   Remove (Kill) processes on the port
echo   -cr  Check and Remove (Combines both actions)
echo.
echo Examples:
echo   port-manager.bat 3000,8080 -c    (Checks ports 3000 and 8080)
echo   port-manager.bat 5432 -r         (Kills process on port 5432)
echo   port-manager.bat -cr 3000 8080   (Checks and kills if busy)
echo ============================================
if "!IS_INTERACTIVE!"=="1" pause
exit /b
