@echo off
:: Chan truy cap BOS tu thiet bi khac (xoa rule da tao)
:: Can chay voi quyen Administrator (Right-click > Run as administrator)

echo ============================================
echo   BOS - Dong tuong lua, chan truy cap LAN
echo ============================================

netsh advfirewall firewall delete rule name="BOS Frontend (Port 3000)"
netsh advfirewall firewall delete rule name="BOS Backend (Port 8080)"

echo.
echo [OK] Da dong port 3000 va 8080. Chi truy cap duoc tu localhost.
echo.
pause
