@echo off
echo === Freelanzer Launcher ===
echo.
echo [1/2] Starting Python backend...
start "Freelanzer Backend" cmd /k "cd /d %~dp0freelanzer\python-backend && pip install -r requirements.txt && python app.py"
echo.
echo [2/2] Starting Frontend (wait 5 seconds)...
timeout /t 5 /nobreak > nul
start "Freelanzer Frontend" cmd /k "cd /d %~dp0freelanzer\frontend && npm start"
echo.
echo Both windows opened! Frontend will open at http://localhost:3000
pause
