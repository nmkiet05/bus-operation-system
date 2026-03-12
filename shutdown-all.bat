@echo off
echo ========================================================
echo BOS - SHUTDOWN SCRIPT
echo ========================================================
echo.

echo [1/3] Stopping Docker Compose Services...
docker-compose down

echo.
echo [2/3] Shutting down WSL (Windows Subsystem for Linux)...
echo WARNING: This will stop all running WSL distributions (including Docker Backend).
wsl --shutdown

echo.
echo [3/3] All systems stopped. You can now safely close this window.
pause
