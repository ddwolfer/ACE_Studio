# 一鍵啟動 ACE Studio：引擎 + 本機小幫手 + 前端（Windows）
# 用法： .\start.ps1
$root = $PSScriptRoot

Write-Host "==> 啟動 ACE-Step 引擎（新視窗，載入模型需一點時間）..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "& '$root\run-engine.ps1'"

Write-Host "==> 啟動本機小幫手（新視窗：開檔總管 / 裁靜音）..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList '-NoExit', '-Command', "& '$root\run-local.ps1'"

Write-Host "==> 啟動前端 dev（本視窗）..." -ForegroundColor Cyan
Write-Host "    瀏覽器開 http://localhost:5173；等引擎視窗顯示 Uvicorn running 後，按介面「初始化服務」" -ForegroundColor DarkGray
Set-Location "$root\frontend"
npm run dev
