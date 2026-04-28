@echo off
echo ================================
echo KILL PROCESS USING PORT 3000
echo ================================

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing PID %%a ...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Done! Port 3000 is free.
pause