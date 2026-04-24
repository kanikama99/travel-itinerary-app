@echo off
cd /d "%~dp0"
start "Spot Map Browser" http://127.0.0.1:8000/
python server.py
pause