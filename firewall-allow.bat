@echo off
:: Cho phep truy cap BOS tu thiet bi khac trong mang LAN
:: Can chay voi quyen Administrator (Right-click > Run as administrator)

echo ============================================
echo   BOS - Mo tuong lua cho truy cap LAN
echo ============================================

netsh advfirewall firewall add rule name="BOS Frontend (Port 3000)" dir=in action=allow protocol=tcp localport=3000
netsh advfirewall firewall add rule name="BOS Backend (Port 8080)" dir=in action=allow protocol=tcp localport=8080

echo.
echo [OK] Da mo port 3000 va 8080.
echo Truy cap tu thiet bi khac: http://192.168.1.3:3000
echo.
pause
