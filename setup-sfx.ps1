# ACE Studio - SFX engine one-time setup (Stable Audio Open)
# Creates engine-sfx\.venv and installs deps. Torch is installed with CUDA 12.4 wheels.
# After this, you still need to (manually):
#   1. Accept the model license at https://huggingface.co/stabilityai/stable-audio-open-1.0
#   2. Login:  engine-sfx\.venv\Scripts\hf.exe auth login
# Then start the engine with .\run-sfx.ps1
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$venv = Join-Path $root 'engine-sfx\.venv'
$py = Join-Path $venv 'Scripts\python.exe'

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host '[setup-sfx] uv not found. Install uv first: https://docs.astral.sh/uv/' -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $py)) {
    Write-Host '[setup-sfx] creating venv at engine-sfx\.venv ...'
    uv venv $venv
}

Write-Host '[setup-sfx] installing torch (CUDA 12.4) ... this downloads ~2.5GB'
uv pip install --python $py torch --index-url https://download.pytorch.org/whl/cu124

Write-Host '[setup-sfx] installing diffusers/transformers/fastapi ...'
uv pip install --python $py -r (Join-Path $root 'engine-sfx\requirements.txt')

Write-Host ''
Write-Host '[setup-sfx] DONE. Next steps (manual):' -ForegroundColor Green
Write-Host '  1. Open https://huggingface.co/stabilityai/stable-audio-open-1.0'
Write-Host '     login and click "Agree and access repository"'
Write-Host '  2. Run:  engine-sfx\.venv\Scripts\hf.exe auth login   (paste your HF token)'
Write-Host '  3. Start the SFX engine:  .\run-sfx.ps1'
Write-Host '     (first /generate downloads ~5GB of model weights)'
