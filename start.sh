#!/usr/bin/env bash
# 一鍵啟動 ACE Studio：引擎 + 本機小幫手 + 前端（macOS / Linux）
set -e
cd "$(dirname "$0")"

echo "==> 啟動 ACE-Step 引擎（背景，載入模型需一點時間）..."
bash run-engine.sh &
echo "==> 啟動本機小幫手（背景）..."
bash run-local.sh &

# SFX 引擎：跑過 setup-sfx.sh 才會啟動
if [ -f engine-sfx/.venv/bin/python ]; then
  echo "==> 啟動 SFX 引擎（背景，:8002）..."
  bash run-sfx.sh &
else
  echo "==> 略過 SFX 引擎（要用先執行： bash setup-sfx.sh）"
fi

echo "==> 啟動前端 dev；瀏覽器開 http://localhost:5173"
trap 'kill 0' EXIT
(cd frontend && npm run dev)
