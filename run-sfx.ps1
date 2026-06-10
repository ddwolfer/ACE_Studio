# ACE Studio - start the SFX engine (Stable Audio Open) on 127.0.0.1:8002
# Requires setup-sfx.ps1 to have been run once (and HF login done).
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$py = Join-Path $root 'engine-sfx\.venv\Scripts\python.exe'

if (-not (Test-Path $py)) {
    Write-Host '[run-sfx] venv not found. Run .\setup-sfx.ps1 first.' -ForegroundColor Red
    exit 1
}

# 8GB VRAM friendly: only the sub-module being used sits on the GPU
if (-not $env:SFX_CPU_OFFLOAD) { $env:SFX_CPU_OFFLOAD = 'true' }
# To force CPU entirely (zero VRAM, slow):  $env:SFX_DEVICE = 'cpu'

Set-Location (Join-Path $root 'engine-sfx')
& $py -m uvicorn sfx_api:app --host 127.0.0.1 --port 8002
