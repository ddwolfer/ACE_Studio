# Start the ACE-Step engine API for ACE Studio.
# Calls api_server.main via python directly (the venv console-script .exe paths break after the folder move).
# IMPORTANT for 8GB GPUs: enable DiT CPU offload, otherwise VAE decode falls back to CPU and hangs.
# Local dev runs with no api key (simplest; see docs/IMPLEMENTATION-SPEC.md section 6).
$env:ACESTEP_OFFLOAD_TO_CPU = 'true'
$env:ACESTEP_OFFLOAD_DIT_TO_CPU = 'true'

$engine = Join-Path $PSScriptRoot 'engine'
Push-Location $engine
try {
    uv run python -c "from acestep.api_server import main; main()" --host 127.0.0.1 --port 8001
} finally {
    Pop-Location
}
