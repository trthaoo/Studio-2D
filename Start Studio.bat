@echo off
rem Double-click to open 2D Studio in your browser.
cd /d "%~dp0"
if not exist node_modules (
  echo First run: installing, this takes a minute...
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    echo.
    echo Install failed. Check that Node.js is installed: https://nodejs.org
    pause
    exit /b 1
  )
)
call npm start
pause
