@echo off
cd /d "%~dp0"
git lfs pull
if errorlevel 1 exit /b 1
node restore-large-pdfs.cjs
if errorlevel 1 exit /b 1
pause
