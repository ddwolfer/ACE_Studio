#!/usr/bin/env bash
# 啟動 ACE-Step 引擎 API（直接用 python 呼叫 main，繞過移動後失效的 console-script）
# ⚠️ 8GB 顯存關鍵：開啟 DiT CPU offload，否則 VAE 解碼掉回 CPU 會卡死。
set -e
export ACESTEP_OFFLOAD_TO_CPU=true
export ACESTEP_OFFLOAD_DIT_TO_CPU=true
cd "$(dirname "$0")/engine"
uv run python -c "from acestep.api_server import main; main()" --host 127.0.0.1 --port 8001
