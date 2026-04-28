@echo off
setlocal EnableDelayedExpansion
:: BOS Port Manager

:menu
cls
echo ============================================
echo        BOS - PORT MANAGER
echo ============================================
echo.
set /p TARGET_PORTS="Enter port number(s) to manage (e.g. 3000 8080): "
if "%TARGET_PORTS%"=="" exit

echo.
echo What do you want to do with port(s) %TARGET_PORTS%?
echo 1. Check Status (View PID)
echo 2. Kill Processes (Free Port)
echo 3. Cancel / Exit
echo.
set /p ACTION="Select action (1-3): "

if "%ACTION%"=="1" goto check_ports
if "%ACTION%"=="2" goto kill_ports
if "%ACTION%"=="3" exit
goto menu

:check_ports
cls
echo ============================================
echo   BOS - CHECKING PORTS: %TARGET_PORTS%
echo ============================================
echo.

for %%P in (%TARGET_PORTS%) do (
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
echo   BOS - KILLING PORTS: %TARGET_PORTS%
echo ============================================
echo.

for %%P in (%TARGET_PORTS%) do (
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
