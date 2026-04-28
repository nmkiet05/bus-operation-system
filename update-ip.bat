@echo off
setlocal EnableDelayedExpansion
echo ============================================
echo   BOS - Update IP in Docker Compose
echo ============================================
echo.

:: Get current WiFi/Ethernet IP using PowerShell
powershell -Command "(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.NetAdapter.Virtual -eq $false } | Select-Object -ExpandProperty IPv4Address | Select-Object -First 1).IPAddress" > "%temp%\bos-ip.txt"
set /p AUTO_IP=<"%temp%\bos-ip.txt"
del "%temp%\bos-ip.txt"

if "%AUTO_IP%"=="" (
    echo [WARNING] Could not detect your IP automatically.
    goto manual_ip
)

echo Auto-detected IP: %AUTO_IP%
echo.
set /p MANUAL_CHOICE="Do you want to enter the IP manually? [Y/N]: "

if /i "%MANUAL_CHOICE%"=="Y" (
    goto manual_ip
) else (
    set "FINAL_IP=%AUTO_IP%"
    goto process_ip
)

:manual_ip
echo.
set /p FINAL_IP="Enter the IP address you want to use: "
if "%FINAL_IP%"=="" (
    echo [ERROR] No IP address entered!
    pause
    exit /b 1
)

:process_ip
echo.
echo Using IP: %FINAL_IP%
echo.

set "FILE=docker-compose.yml"
set "TEMP_FILE=docker-compose.tmp"

echo [PROGRESS] Updating docker-compose.yml...
powershell -Command "(Get-Content '%FILE%') -replace 'http://\d+\.\d+\.\d+\.\d+:3000', 'http://%FINAL_IP%:3000' -replace 'http://\d+\.\d+\.\d+\.\d+:8080', 'http://%FINAL_IP%:8080' -replace 'http://\d+\.\d+\.\d+\.\d+:5173', 'http://%FINAL_IP%:5173' | Set-Content '%TEMP_FILE%'"

move /Y "%TEMP_FILE%" "%FILE%" >nul

echo [SUCCESS] Updated endpoints:
echo  - Frontend: http://%FINAL_IP%:3000
echo  - Backend:  http://%FINAL_IP%:8080/api
echo.

echo ============================================
set /p DOCKER_REBUILD="Do you want to rebuild Docker now? [Y/N]: "

if /i "%DOCKER_REBUILD%"=="Y" (
    echo Building...
    docker-compose up -d --build backend frontend
    echo Done!
) else (
    echo Please run the following command to apply changes:
    echo docker-compose up -d --build backend frontend
)

pause