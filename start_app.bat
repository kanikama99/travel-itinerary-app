@echo off
cd /d "%~dp0"
taskkill /f /im python.exe >nul 2>&1
timeout /t 1 >nul
start "Spot Map Browser" http://127.0.0.1:8000/top.html
python server.py
pause