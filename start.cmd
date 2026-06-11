@echo off
rem ACE Studio one-click launcher: double-click to start engine + helper + SFX + frontend.
rem (Just wraps start.ps1; Bypass needed because .ps1 double-click is blocked by default policy.)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
echo.
echo ACE Studio stopped. Close the other service windows if they are still open.
pause
