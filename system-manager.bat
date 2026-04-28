@echo off
:: BOS System Manager

:menu
cls
echo ============================================
echo        BOS - SYSTEM MANAGER
echo ============================================
echo.
echo 1. Start System (Build ^& Run Docker)
echo 2. Shutdown System (Stop Docker ^& WSL)
echo 3. Reset System (Clear Database ^& Rebuild)
echo 4. Exit
echo.
set /p choice=Select an option (1-4): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto shutdown
if "%choice%"=="3" goto reset
if "%choice%"=="4" exit

:start
cls
echo ============================================
echo   BOS - START SYSTEM
echo ============================================
echo.
echo [1/3] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running! Please start Docker Desktop first.
    pause
    goto menu
)

echo.
echo [2/3] Building and Starting Services (Database, Redis, Backend, Frontend)...
echo This may take a few minutes if running for the first time...
docker-compose up -d --build

echo.
echo [3/3] System is Starting!
echo --------------------------------------------------------
echo Frontend Web   : http://localhost:3000
echo Backend API    : http://localhost:8080/api
echo Swagger UI     : http://localhost:8080/swagger-ui/index.html
echo PgAdmin        : http://localhost:5050
echo --------------------------------------------------------
echo.
pause
goto menu

:shutdown
cls
echo ============================================
echo   BOS - SHUTDOWN SYSTEM
echo ============================================
echo.
echo [1/2] Stopping Docker Compose Services...
docker-compose down

echo.
echo [2/2] Shutting down WSL (Windows Subsystem for Linux)...
echo WARNING: This will stop all running WSL distributions.
wsl --shutdown

echo.
echo [OK] All systems stopped.
echo.
pause
goto menu

:reset
cls
echo ============================================
echo   BOS - RESET SYSTEM (DANGER)
echo ============================================
echo.
echo WARNING: This will DESTROY the database and all cached volumes.
echo Are you sure you want to proceed?
set /p confirm=Type 'Y' to continue, or any other key to cancel: 
if /I "%confirm%" neq "Y" goto menu

echo.
echo [1/2] Stopping System and Destroying Volumes...
docker-compose down -v

echo.
echo [2/2] Rebuilding and Starting System...
docker-compose up -d --build

echo.
echo [OK] System reset and started.
echo.
pause
goto menu
