# 啟動 ACE-Step 引擎 API（供 ACE Studio 前端連線）
# 直接用 python 呼叫 api_server.main，繞過 venv 移動後失效的 console-script .exe
# 本機開發不設 api key 最省事（見 docs/IMPLEMENTATION-SPEC.md §6）
$engine = Join-Path $PSScriptRoot "engine"
Push-Location $engine
try {
    uv run python -c "from acestep.api_server import main; main()" --host 127.0.0.1 --port 8001
} finally {
    Pop-Location
}
