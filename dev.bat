@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed or not on PATH.
  echo Install from https://nodejs.org/ then run this again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

if not exist ".env.local" (
  if exist ".env.example" (
    echo Creating .env.local from .env.example...
    copy /y ".env.example" ".env.local" >nul
    echo Edit .env.local with your Supabase URL and anon key.
  )
)

echo Starting REOS dev server...
call npm run dev

pause
