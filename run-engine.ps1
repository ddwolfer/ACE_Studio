# 啟動 ACE-Step 引擎 API（供 ACE Studio 前端連線）
# 直接用 python 呼叫 api_server.main，繞過 venv 移動後失效的 console-script .exe
#
# ⚠️ 8GB 顯存關鍵：開啟 DiT CPU offload，否則 DiT 佔滿顯存 → VAE 解碼掉回 CPU → 卡死。
#   ACESTEP_OFFLOAD_DIT_TO_CPU=true 讓 DiT 在解碼時退出顯存，VAE 在 GPU 解碼（實測 10s 約 5 秒完成）。
# 本機開發不設 api key 最省事（見 docs/IMPLEMENTATION-SPEC.md §6）
$env:ACESTEP_OFFLOAD_TO_CPU = 'true'
$env:ACESTEP_OFFLOAD_DIT_TO_CPU = 'true'

$engine = Join-Path $PSScriptRoot "engine"
Push-Location $engine
try {
    uv run python -c "from acestep.api_server import main; main()" --host 127.0.0.1 --port 8001
} finally {
    Pop-Location
}
