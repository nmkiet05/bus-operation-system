@echo off
setlocal EnableDelayedExpansion

if "%~1"=="" goto help

set PORTS=
set DO_CHECK=0
set DO_REMOVE=0

:: Parse all arguments dynamically
for %%A in (%*) do (
    set "arg=%%A"
    if "!arg:~0,1!"=="-" (
        :: It's a flag (Linux-style)
        echo !arg! | findstr /i "c" >nul && set DO_CHECK=1
        echo !arg! | findstr /i "r" >nul && set DO_REMOVE=1
    ) else (
        :: It's a port (support both space and comma separation)
        set "clean_port=!arg:,= !"
        set PORTS=!PORTS! !clean_port!
    )
)

:: Default to Check mode if no flags provided
if !DO_CHECK!==0 if !DO_REMOVE!==0 set DO_CHECK=1

if "!PORTS!"=="" (
    echo [ERROR] No ports specified.
    echo.
    goto help
)

echo ============================================
echo   BOS - PORT MANAGER
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

exit /b

:help
echo ============================================
echo        BOS - PORT MANAGER (CLI)
echo ============================================
echo Usage: port-manager.bat [ports] [flags]
echo.
echo Ports: Space or comma-separated list of ports
echo.
echo Flags (Linux-style):
echo   -c   Check port status (Default if no flag provided)
echo   -r   Remove (Kill) processes on the port
echo   -cr  Check and Remove (Combines both actions, order independent)
echo.
echo Examples:
echo   port-manager.bat 3000,8080 -c    (Checks ports 3000 and 8080)
echo   port-manager.bat 5432 -r         (Kills process on port 5432)
echo   port-manager.bat -cr 3000 8080   (Checks and kills if busy)
echo ============================================
exit /b
