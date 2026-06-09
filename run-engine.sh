#!/usr/bin/env bash
# 啟動 ACE-Step 引擎 API（直接用 python 呼叫 main，繞過移動後失效的 console-script）
set -e
cd "$(dirname "$0")/engine"
uv run python -c "from acestep.api_server import main; main()" --host 127.0.0.1 --port 8001
