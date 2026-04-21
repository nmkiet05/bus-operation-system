@echo off
chcp 65001 >nul
:: Tu dong cap nhat IP WiFi vao docker-compose.yml
:: Khong can quyen Admin

echo ============================================
echo   BOS - Cap nhat IP vao Docker Compose
echo ============================================
echo.

:: Lay IP WiFi hien tai bang PowerShell (chi lay card mang thuc te dang ket noi)
powershell -Command "(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Virtual -eq $false } | Select-Object -ExpandProperty IPv4Address | Select-Object -First 1).IPAddress" > "%temp%\bos-ip.txt"
set /p CURRENT_IP=<"%temp%\bos-ip.txt"
del "%temp%\bos-ip.txt"

if "%CURRENT_IP%"=="" (
    echo [THONG BAO] Khong the tu dong tim thay IP mang LAN WiFi [Co the may tinh dang dung VMWare/LAN ao].
    echo [THONG BAO] Vui long nhap IP mang may tinh bang tay. Vi du: 10.10.x.x hoac 192.168.x.x
    set /p CURRENT_IP="Nhap IP thuc te: "
)

if "%CURRENT_IP%"=="" (
    echo [LOI] Khong co IP nao duoc nhap!
    pause
    exit /b 1
)

echo Tim thay IP thuc te: %CURRENT_IP%
echo.

:: Tao file tam voi IP moi
set "FILE=docker-compose.yml"
set "TEMP_FILE=docker-compose.tmp"

:: Thay the bat ky IP cu nao trong CORS, API URL, va build args
echo [TIEN TRINH] Dang cap nhat cau hinh trong file docker-compose.yml...
powershell -Command "(Get-Content '%FILE%') -replace 'http://\d+\.\d+\.\d+\.\d+:3000', 'http://%CURRENT_IP%:3000' -replace 'http://\d+\.\d+\.\d+\.\d+:8080', 'http://%CURRENT_IP%:8080' | Set-Content '%TEMP_FILE%'"

:: Ghi de file goc
move /Y "%TEMP_FILE%" "%FILE%" >nul

echo [THANH CONG] Da cap nhat docker-compose.yml voi IP moi:
echo  - CORS Frontend:  http://%CURRENT_IP%:3000
echo  - Backend API:    http://%CURRENT_IP%:8080/api
echo.
echo ============================================
echo [CAU HOI] Ban co muon tu dong Rebuild Docker ngay bay gio khong?
echo - Se mat vai phut de build lai Frontend voi IP moi
set /p DOCKER_REBUILD="Nhan Y de Rebuild, hoac N de thoat [Y/N]: "

if /i "%DOCKER_REBUILD%"=="Y" (
    echo.
    echo [TIEN TRINH] Dang Build va Start lai Docker...
    docker compose up -d --build backend frontend
    echo.
    echo [THANH CONG] He thong da hoat dong tren IP Public/LAN!
) else (
    echo.
    echo [THONG BAO] Vui long chay lenh sau bang tay de ap dung IP moi:
    echo docker compose up -d --build backend frontend
)

echo.
pause
