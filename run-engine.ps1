# 啟動 ACE-Step 引擎 API（供 ACE Studio 前端連線）
# 本機開發不設 api key 最省事（見 docs/IMPLEMENTATION-SPEC.md §6）
$engine = Join-Path $PSScriptRoot "engine"
Push-Location $engine
try {
    uv run acestep-api --host 127.0.0.1 --port 8001
} finally {
    Pop-Location
}
