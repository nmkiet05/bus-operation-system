@echo off
echo ================================
echo KILL PROCESS USING PORT 8080
echo ================================

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo Killing PID %%a ...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Done! Port 8080 is free.
pause
