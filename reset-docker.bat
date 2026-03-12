@echo off
echo ========================================================
echo   BOS - RESET SYSTEM
echo   (Chay file nay khi muon sua loi hoac cap nhat cau hinh moi)
echo ========================================================
echo.

echo [1/2] Stopping old System and Cleaning Volumes (Running docker-compose down -v)...
docker-compose down -v

echo.
echo [2/2] Starting new System...
call start-app.bat
