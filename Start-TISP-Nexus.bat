@echo off
setlocal
cd /d "%~dp0"
echo Starting TISP Nexus one-click installer...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" -Mode Demo
echo.
echo If the dashboard did not open automatically, visit http://127.0.0.1:5173/
pause
