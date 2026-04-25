@echo off
chcp 65001 >nul
echo ============================================
echo   BOS - Cap nhat IP vao Docker Compose
echo ============================================
echo.

:: Lay IP WiFi hien tai
powershell -Command "(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Virtual -eq $false } | Select-Object -ExpandProperty IPv4Address | Select-Object -First 1).IPAddress" > "%temp%\bos-ip.txt"
set /p CURRENT_IP=<"%temp%\bos-ip.txt"
del "%temp%\bos-ip.txt"

:: Neu khong lay duoc IP -> bat buoc nhap tay
if "%CURRENT_IP%"=="" (
    echo [THONG BAO] Khong the tu dong tim thay IP.
    set /p CURRENT_IP="Nhap IP thuc te: "
) else (
    echo Tim thay IP tu dong: %CURRENT_IP%
    echo.
    set /p MANUAL_IP="Ban co muon nhap IP thu cong khong? [Y/N]: "
    
    if /i "%MANUAL_IP%"=="Y" (
        set /p CURRENT_IP="Nhap IP ban muon dung: "
    )
)

:: Check IP cuoi cung
if "%CURRENT_IP%"=="" (
    echo [LOI] Khong co IP nao duoc nhap!
    pause
    exit /b 1
)

echo.
echo Su dung IP: %CURRENT_IP%
echo.

:: Tao file tam voi IP moi
set "FILE=docker-compose.yml"
set "TEMP_FILE=docker-compose.tmp"

echo [TIEN TRINH] Dang cap nhat docker-compose.yml...
powershell -Command "(Get-Content '%FILE%') -replace 'http://\d+\.\d+\.\d+\.\d+:3000', 'http://%CURRENT_IP%:3000' -replace 'http://\d+\.\d+\.\d+\.\d+:8080', 'http://%CURRENT_IP%:8080' | Set-Content '%TEMP_FILE%'"

move /Y "%TEMP_FILE%" "%FILE%" >nul

echo [THANH CONG] Da cap nhat:
echo  - Frontend: http://%CURRENT_IP%:3000
echo  - Backend:  http://%CURRENT_IP%:8080/api
echo.

echo ============================================
set /p DOCKER_REBUILD="Ban co muon rebuild Docker khong? [Y/N]: "

if /i "%DOCKER_REBUILD%"=="Y" (
    echo Dang build...
    docker compose up -d --build backend frontend
    echo Hoan tat!
) else (
    echo Hay chay:
    echo docker compose up -d --build backend frontend
)

pause