#!/usr/bin/env bash
# 一鍵啟動 ACE Studio：引擎 + 本機小幫手 + 前端（macOS / Linux）
set -e
cd "$(dirname "$0")"

echo "==> 啟動 ACE-Step 引擎（背景，載入模型需一點時間）..."
bash run-engine.sh &
echo "==> 啟動本機小幫手（背景）..."
bash run-local.sh &

echo "==> 啟動前端 dev；瀏覽器開 http://localhost:5173"
trap 'kill 0' EXIT
(cd frontend && npm run dev)
