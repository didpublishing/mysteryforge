@echo off
echo Building MysteryForge Docker image...
docker build -t mysteryforge .
if errorlevel 1 (
    echo Build failed
    pause
    exit /b 1
)
echo.
echo Build complete Run 'start.bat' to launch.
pause
