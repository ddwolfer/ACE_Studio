# ACE Studio 一鍵安裝（Windows / PowerShell）
# 用途：把 ACE-Step 引擎裝到 engine/、下載模型、裝前端相依。
# 用法： powershell -ExecutionPolicy Bypass -File .\setup.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$engine = Join-Path $root "engine"

Write-Host "==> ACE Studio setup" -ForegroundColor Cyan

# 0. 檢查 uv
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "未偵測到 uv，先安裝 uv..." -ForegroundColor Yellow
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
}

# 1. 取得引擎（若 engine/ 尚未存在）
if (-not (Test-Path (Join-Path $engine "pyproject.toml"))) {
    Write-Host "==> Clone ACE-Step 引擎到 engine/ ..." -ForegroundColor Cyan
    git clone https://github.com/ace-step/ACE-Step-1.5.git $engine
} else {
    Write-Host "==> 已偵測到 engine/（略過 clone）" -ForegroundColor Green
}

# 2. 安裝引擎相依 + 下載模型（v15-turbo 2B：app 預設、8GB 友善；想用 XL 可之後自行下載）
Push-Location $engine
Write-Host "==> uv sync（安裝相依）..." -ForegroundColor Cyan
uv sync
Write-Host "==> 下載 v15-turbo 模型（首次較久；已存在會略過）..." -ForegroundColor Cyan
uv run acestep-download --model acestep-v15-turbo
Pop-Location

# 3. 前端相依（若 frontend/ 已有 package.json）
$fe = Join-Path $root "frontend"
if (Test-Path (Join-Path $fe "package.json")) {
    Write-Host "==> 安裝前端相依..." -ForegroundColor Cyan
    Push-Location $fe; npm install; Pop-Location
}

Write-Host "`n✅ 安裝完成。啟動：雙擊 start.cmd（全部服務 + 前端）" -ForegroundColor Green
Write-Host "   選配：SFX 引擎跑 .\setup-sfx.ps1；Claude Code MCP 跑 cd mcp-server; npm install" -ForegroundColor Green
