#!/usr/bin/env bash
# SFX 引擎（Stable Audio Open）安裝 — macOS / Linux
# 用法： bash setup-sfx.sh
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
SFX="$ROOT/engine-sfx"

if ! command -v uv >/dev/null 2>&1; then
  echo "==> 未偵測到 uv，先安裝..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi

cd "$SFX"
echo "==> 建立 venv（Python 3.11）..."
uv venv .venv --python 3.11

PY="$SFX/.venv/bin/python"
if [[ "$OSTYPE" == darwin* ]]; then
  # macOS：PyPI 預設 wheel 內建 MPS（Apple Silicon GPU）支援
  echo "==> 安裝 torch（macOS / MPS）..."
  uv pip install --python "$PY" torch
else
  # Linux + NVIDIA：CUDA 12.4 wheel
  echo "==> 安裝 torch（CUDA 12.4）..."
  uv pip install --python "$PY" torch --index-url https://download.pytorch.org/whl/cu124
fi

echo "==> 安裝其餘相依..."
uv pip install --python "$PY" -r requirements.txt

cat <<'EOF'

✅ SFX 引擎安裝完成。還差兩步手動授權（gated 模型）：
  1. 瀏覽器登入 HuggingFace，到 https://huggingface.co/stabilityai/stable-audio-open-1.0
     填表並按「Agree and access repository」
  2. 終端機執行： engine-sfx/.venv/bin/hf auth login   （貼上 read 權限的 token）

之後啟動： bash run-sfx.sh   （或 bash start.sh 一鍵全開）
詳見 engine-sfx/README.md；商用注意 Stability 註冊與標註。
EOF
