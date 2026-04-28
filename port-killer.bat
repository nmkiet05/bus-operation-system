@echo off
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
echo 5. Kill Custom Port
echo 6. Exit
echo.
set /p choice=Select an option (1-6): 

if "%choice%"=="1" set PORT_TO_KILL=3000 & goto kill_port
if "%choice%"=="2" set PORT_TO_KILL=8080 & goto kill_port
if "%choice%"=="3" set PORT_TO_KILL=5432 & goto kill_port
if "%choice%"=="4" set PORT_TO_KILL=5050 & goto kill_port
if "%choice%"=="5" goto custom_port
if "%choice%"=="6" exit

:custom_port
echo.
set /p PORT_TO_KILL="Enter port number: "
if "%PORT_TO_KILL%"=="" goto menu
goto kill_port

:kill_port
cls
echo ============================================
echo   BOS - KILLING PORT %PORT_TO_KILL%
echo ============================================
echo.

set "process_found=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT_TO_KILL% ^| findstr LISTENING') do (
    set "process_found=1"
    echo Killing PID %%a ...
    taskkill /PID %%a /F >nul 2>&1
)

if "%process_found%"=="0" (
    echo Port %PORT_TO_KILL% is not in use.
) else (
    echo Done! Port %PORT_TO_KILL% is now free.
)

echo.
pause
goto menu
