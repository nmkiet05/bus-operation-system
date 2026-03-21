@echo off
:: Kiem tra tuong lua BOS da mo chua

echo ============================================
echo   BOS - Kiem tra trang thai tuong lua
echo ============================================
echo.

echo [Port 3000 - Frontend]
netsh advfirewall firewall show rule name="BOS Frontend (Port 3000)" >nul 2>&1
if %errorlevel%==0 (
    echo   DA MO
) else (
    echo   CHUA MO - Chay firewall-allow.bat voi quyen Admin
)

echo.
echo [Port 8080 - Backend]
netsh advfirewall firewall show rule name="BOS Backend (Port 8080)" >nul 2>&1
if %errorlevel%==0 (
    echo   DA MO
) else (
    echo   CHUA MO - Chay firewall-allow.bat voi quyen Admin
)

echo.
echo ============================================
pause
