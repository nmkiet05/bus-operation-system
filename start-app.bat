@echo off
echo ========================================================
echo   BUS OPERATION SYSTEM (BOS) - ONE CLICK START
echo ========================================================
echo.
echo [1/3] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running! Please start Docker Desktop first.
    pause
    exit /b
)

echo.
echo [2/3] Building and Starting System (Backend + Frontend + DB)...
echo This may take a few minutes for the first time...
docker-compose up -d --build

echo.
echo [3/3] System is Starting!
echo --------------------------------------------------------
echo Backend API    : http://localhost:8080/swagger-ui/index.html
echo Frontend Web   : http://localhost:3000
echo Database (DB)  : localhost:5432
echo --------------------------------------------------------
echo.
echo Press any key to close this window...
pause
