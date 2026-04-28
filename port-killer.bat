@echo off
:: ======================================================================
:: BOS PORT KILLER MANAGER
:: ======================================================================
:: HOW IT WORKS:
:: 1. Uses `netstat -ano` to scan all active network connections.
:: 2. Uses `findstr :PORT` to filter only the connections using the target port.
:: 3. Uses `findstr LISTENING` to find the exact process holding the port open.
:: 4. Extracts the Process ID (PID) from the 5th column of the netstat output.
:: 5. Uses `taskkill /PID <PID> /F` to forcefully terminate the process.
:: This is extremely useful when a Spring Boot or Next.js instance crashes
:: but leaves the port bound in the background, preventing a restart.
:: ======================================================================

:menu
cls
echo ============================================
echo      BOS - PORT KILLER MANAGER
echo ============================================
echo.
echo What this tool does:
echo - Scans for processes actively LISTENING on a specific port.
echo - Extracts their Process ID (PID) and forcefully terminates them.
echo - Frees up the port so you can restart your servers without "Port already in use" errors.
echo.
echo 1. Kill Port 3000 (Frontend Next.js)
echo 2. Kill Port 8080 (Backend Spring Boot)
echo 3. Kill Port 5432 (PostgreSQL Database)
echo 4. Kill Port 5050 (PgAdmin)
echo 5. Kill a Custom Port
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
set /p PORT_TO_KILL="Enter the port number to kill: "
if "%PORT_TO_KILL%"=="" (
    echo [ERROR] No port entered!
    pause
    goto menu
)
goto kill_port

:kill_port
cls
echo ============================================
echo   BOS - KILLING PROCESS ON PORT %PORT_TO_KILL%
echo ============================================
echo.

set "process_found=0"
echo [1/3] Scanning network connections for port %PORT_TO_KILL%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT_TO_KILL% ^| findstr LISTENING') do (
    set "process_found=1"
    echo [2/3] Found LISTENING process. Extracted PID: %%a
    echo [3/3] Sending forceful termination signal (taskkill /F) to PID %%a...
    taskkill /PID %%a /F >nul 2>&1
)

if "%process_found%"=="0" (
    echo [INFO] No process is currently listening on port %PORT_TO_KILL%. The port is already free.
) else (
    echo.
    echo [SUCCESS] The process has been terminated. Port %PORT_TO_KILL% is now free.
)

echo.
pause
goto menu
