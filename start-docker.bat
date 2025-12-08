@echo off
echo Starting Jarvis Server with Docker...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Create data directory if it doesn't exist
if not exist "data" mkdir data

REM Start the services
docker-compose up -d

echo.
echo Jarvis Server is starting...
echo.
echo Access the application at: http://localhost:8080
echo View logs with: docker-compose logs -f
echo Stop with: docker-compose down
echo.

REM Optionally open browser
echo Opening browser...
start http://localhost:8080

pause