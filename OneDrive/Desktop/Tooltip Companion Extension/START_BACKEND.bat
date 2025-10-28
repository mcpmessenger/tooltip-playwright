@echo off
echo.
echo ====================================
echo   Tooltip Companion Backend Server
echo ====================================
echo.

cd "%~dp0playwright_service"

if not exist "server.js" (
    echo ERROR: server.js not found in playwright_service directory!
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Starting backend server on http://localhost:3000
echo.
echo Keep this window open!
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

pause

