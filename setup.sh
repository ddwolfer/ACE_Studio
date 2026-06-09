#!/usr/bin/env bash
# ACE Studio 一鍵安裝（macOS / Linux）
# 用法： bash setup.sh
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
ENGINE="$ROOT/engine"

echo "==> ACE Studio setup"

# 0. uv
if ! command -v uv >/dev/null 2>&1; then
  echo "未偵測到 uv，先安裝..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi

# 1. 引擎
if [ ! -f "$ENGINE/pyproject.toml" ]; then
  echo "==> Clone ACE-Step 引擎到 engine/ ..."
  git clone https://github.com/ace-step/ACE-Step-1.5.git "$ENGINE"
else
  echo "==> 已偵測到 engine/（略過 clone）"
fi

# 2. 相依 + 模型
cd "$ENGINE"
echo "==> uv sync ..."
uv sync
echo "==> 下載 XL Turbo 模型（已存在會略過）..."
uv run acestep-download --model acestep-v15-xl-turbo
cd "$ROOT"

# 3. 前端
if [ -f "$ROOT/frontend/package.json" ]; then
  echo "==> 安裝前端相依..."
  (cd "$ROOT/frontend" && npm install)
fi

# 4. .env
[ -f "$ROOT/.env" ] || { cp "$ROOT/.env.example" "$ROOT/.env"; echo "==> 已建立 .env"; }

echo ""
echo "✅ 安裝完成。啟動：bash run-engine.sh  然後  cd frontend && npm run dev"
