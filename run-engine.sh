#!/usr/bin/env bash
# 啟動 ACE-Step 引擎 API
set -e
cd "$(dirname "$0")/engine"
uv run acestep-api --host 127.0.0.1 --port 8001
