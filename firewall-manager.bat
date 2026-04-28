@echo off
:: BOS Firewall Manager
:: Must be run as Administrator (Right-click > Run as administrator)

:menu
cls
echo ============================================
echo      BOS - FIREWALL MANAGER
echo ============================================
echo.
echo 1. Check Firewall Status
echo 2. Allow LAN Access (Open Port 3000, 8080)
echo 3. Block LAN Access (Close Port 3000, 8080)
echo 4. Exit
echo.
set /p choice=Select an option (1-4): 

if "%choice%"=="1" goto check
if "%choice%"=="2" goto allow
if "%choice%"=="3" goto block
if "%choice%"=="4" exit

:check
cls
echo ============================================
echo   BOS - CHECK FIREWALL STATUS
echo ============================================
echo.
echo [Port 3000 - Frontend]
netsh advfirewall firewall show rule name="BOS Frontend (Port 3000)" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] ALLOWED
) else (
    echo   [X]  BLOCKED
)
echo.
echo [Port 8080 - Backend]
netsh advfirewall firewall show rule name="BOS Backend (Port 8080)" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] ALLOWED
) else (
    echo   [X]  BLOCKED
)
echo.
pause
goto menu

:allow
cls
echo ============================================
echo   BOS - ALLOW LAN ACCESS
echo ============================================
netsh advfirewall firewall add rule name="BOS Frontend (Port 3000)" dir=in action=allow protocol=tcp localport=3000
netsh advfirewall firewall add rule name="BOS Backend (Port 8080)" dir=in action=allow protocol=tcp localport=8080
echo.
echo [OK] Ports 3000 and 8080 are now OPEN.
echo You can access the system from other devices via this PC's IP (e.g., http://192.168.1.X:3000)
echo.
pause
goto menu

:block
cls
echo ============================================
echo   BOS - BLOCK LAN ACCESS
echo ============================================
netsh advfirewall firewall delete rule name="BOS Frontend (Port 3000)" >nul 2>&1
netsh advfirewall firewall delete rule name="BOS Backend (Port 8080)" >nul 2>&1
echo.
echo [OK] Ports 3000 and 8080 are now CLOSED.
echo The system is only accessible from localhost.
echo.
pause
goto menu
