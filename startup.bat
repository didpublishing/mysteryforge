@echo off
REM Check if Docker is responding

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running or not responding. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Start the app and log output
if exist docker-compose.yml (
    echo Starting with Docker Compose...
    docker-compose up > log.txt 2>&1
) else (
    echo Starting with Node.js...
    node src/server.js > log.txt 2>&1
) 