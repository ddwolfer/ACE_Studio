# One-command launcher for ACE Studio: engine + local helper + frontend (Windows).
# Usage: .\start.ps1
# (ASCII-only on purpose: Windows PowerShell 5.1 mis-parses UTF-8-no-BOM CJK inside strings.)
$root = $PSScriptRoot
$engineScript = Join-Path $root 'run-engine.ps1'
$localScript = Join-Path $root 'run-local.ps1'
$frontend = Join-Path $root 'frontend'

Write-Host "==> Starting ACE-Step engine (new window; model load takes a bit)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "& '$engineScript'"

Write-Host "==> Starting local helper (new window; open-folder / trim-silence)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "& '$localScript'"

Write-Host "==> Starting frontend dev (this window)." -ForegroundColor Cyan
Write-Host "    Open http://localhost:5173 ; after the engine window shows 'Uvicorn running', click 'Initialize service' in the app." -ForegroundColor DarkGray
Set-Location $frontend
npm run dev
