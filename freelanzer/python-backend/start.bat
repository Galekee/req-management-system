@echo off
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting Freelanzer Python backend on port 5000...
python app.py
pause
