@echo off
:: BOS Firewall Manager
:: Can chay voi quyen Administrator (Right-click > Run as administrator)

:menu
cls
echo ============================================
echo      BOS - QUAN LY TUONG LUA (FIREWALL)
echo ============================================
echo.
echo 1. Kiem tra trang thai (Check Status)
echo 2. Mo tuong lua (Allow LAN Access - Port 3000, 8080)
echo 3. Dong tuong lua (Block LAN Access)
echo 4. Thoat
echo.
set /p choice=Chon thao tac (1-4): 

if "%choice%"=="1" goto check
if "%choice%"=="2" goto allow
if "%choice%"=="3" goto block
if "%choice%"=="4" exit

:check
cls
echo ============================================
echo   BOS - Kiem tra trang thai tuong lua
echo ============================================
echo.
echo [Port 3000 - Frontend]
netsh advfirewall firewall show rule name="BOS Frontend (Port 3000)" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] DA MO
) else (
    echo   [X]  CHUA MO
)
echo.
echo [Port 8080 - Backend]
netsh advfirewall firewall show rule name="BOS Backend (Port 8080)" >nul 2>&1
if %errorlevel%==0 (
    echo   [OK] DA MO
) else (
    echo   [X]  CHUA MO
)
echo.
pause
goto menu

:allow
cls
echo ============================================
echo   BOS - Mo tuong lua cho truy cap LAN
echo ============================================
netsh advfirewall firewall add rule name="BOS Frontend (Port 3000)" dir=in action=allow protocol=tcp localport=3000
netsh advfirewall firewall add rule name="BOS Backend (Port 8080)" dir=in action=allow protocol=tcp localport=8080
echo.
echo [OK] Da mo port 3000 va 8080.
echo Truy cap tu thiet bi khac qua IP cua may nay (VD: http://192.168.1.X:3000)
echo.
pause
goto menu

:block
cls
echo ============================================
echo   BOS - Dong tuong lua, chan truy cap LAN
echo ============================================
netsh advfirewall firewall delete rule name="BOS Frontend (Port 3000)" >nul 2>&1
netsh advfirewall firewall delete rule name="BOS Backend (Port 8080)" >nul 2>&1
echo.
echo [OK] Da dong port 3000 va 8080. Chi truy cap duoc tu localhost.
echo.
pause
goto menu
