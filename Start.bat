@echo off
setlocal enabledelayedexpansion
pnpm install
if exist .safe.env (
  for /f "usebackq tokens=1,* delims==" %%a in (".safe.env") do (
    if not "%%a"=="" set "%%a=%%b"
  )
)

REM Ensure data directory exists and default DATABASE_URL set
if not exist data (
  mkdir data
)
if not defined DATABASE_URL set "DATABASE_URL=file:./data/db.sqlite"

call refresh-data.bat
if errorlevel 1 (
  exit /b 1
)
pnpm build
if errorlevel 1 (
  exit /b 1
)
pnpm start