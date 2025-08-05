@echo off
pnpm install
set /p VARS=<.safe.env
for /f "tokens=1,* delims==" %%a in ("%VARS%") do set %%a=%%b
call refresh-data.bat
pnpm build
pnpm start