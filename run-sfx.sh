#!/usr/bin/env bash
# 啟動 SFX 引擎（Stable Audio Open）於 127.0.0.1:8002 — macOS / Linux
# 需先跑過一次 setup-sfx.sh（與 HF 授權，見 engine-sfx/README.md）
set -e
cd "$(dirname "$0")/engine-sfx"

if [ ! -f .venv/bin/python ]; then
  echo "[run-sfx] 找不到 venv，先執行： bash setup-sfx.sh" >&2
  exit 1
fi

# CUDA 上開 cpu offload（8GB 友善）；mac(MPS)/CPU 下此設定無作用、會自動忽略
export SFX_CPU_OFFLOAD="${SFX_CPU_OFFLOAD:-true}"
# 想強制裝置可設 SFX_DEVICE=cpu|mps|cuda（預設自動偵測：cuda → mps → cpu）

exec .venv/bin/python -m uvicorn sfx_api:app --host 127.0.0.1 --port 8002
