@echo off
chcp 65001 >nul
:: Tu dong cap nhat IP WiFi vao docker-compose.yml
:: Khong can quyen Admin

echo ============================================
echo   BOS - Cap nhat IP vao Docker Compose
echo ============================================
echo.

:: Lay IP WiFi hien tai
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /V "172\. 10\."') do (
    set "RAW=%%a"
)
:: Xoa khoang trang dau
set "CURRENT_IP=%RAW: =%"

if "%CURRENT_IP%"=="" (
    echo [LOI] Khong tim thay IP WiFi. Kiem tra ket noi mang.
    pause
    exit /b 1
)

echo Tim thay IP: %CURRENT_IP%
echo.

:: Tao file tam voi IP moi
set "FILE=docker-compose.yml"
set "TEMP_FILE=docker-compose.tmp"

:: Thay the bat ky IP cu nao trong CORS, API URL, va build args
powershell -Command "(Get-Content '%FILE%') -replace 'http://\d+\.\d+\.\d+\.\d+:3000', 'http://%CURRENT_IP%:3000' -replace 'http://\d+\.\d+\.\d+\.\d+:8080', 'http://%CURRENT_IP%:8080' | Set-Content '%TEMP_FILE%'"

:: Ghi de file goc
move /Y "%TEMP_FILE%" "%FILE%" >nul

echo [OK] Da cap nhat docker-compose.yml:
echo     CORS:      http://%CURRENT_IP%:3000
echo     API_URL:   http://%CURRENT_IP%:8080/api
echo     Build ARG: http://%CURRENT_IP%:8080/api
echo.
echo Rebuild: docker compose up -d --build backend frontend
echo.
pause
