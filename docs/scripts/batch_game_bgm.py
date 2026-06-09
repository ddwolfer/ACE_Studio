#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
batch_game_bgm.py — 一次批次產生整套遊戲 BGM / 音效

讀取 presets.json，對每個場景呼叫 generate.py，輸出到 ./out/ 資料夾。

執行方式：一樣要用 `uv run python`（讓子程序沿用裝了 acestep/torch 的環境）。
  cd D:\AI\ACE-Step-1.5
  uv run python scripts\batch_game_bgm.py

用法：
  uv run python scripts\batch_game_bgm.py                # 跑全部預設
  uv run python scripts\batch_game_bgm.py battle boss    # 只跑指定 name
  uv run python scripts\batch_game_bgm.py --model acestep-v15-xl-sft  # 換高品質模型
  uv run python scripts\batch_game_bgm.py --print-cli    # 只印每個場景的官方 CLI 指令

每個場景固定 seed（依名稱衍生）以利重現；要重抽改 --seed-base。
"""
import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PRESETS = os.path.join(HERE, "presets.json")
GENERATE = os.path.join(HERE, "generate.py")
OUT_DIR = os.path.join(HERE, "out")


def load_presets():
    with open(PRESETS, encoding="utf-8") as f:
        return json.load(f)["presets"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="*", help="只跑這些 preset name（省略=全部）")
    ap.add_argument("--model", default="acestep-v15-xl-turbo")
    ap.add_argument("--seed-base", type=int, default=1000)
    ap.add_argument("--print-cli", action="store_true")
    ap.add_argument("--repo", default=os.environ.get("ACESTEP_REPO", "."))
    args = ap.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    presets = load_presets()
    if args.names:
        presets = [p for p in presets if p["name"] in set(args.names)]
        if not presets:
            print("[!] 找不到符合的 preset name。可用：",
                  ", ".join(p["name"] for p in load_presets()))
            sys.exit(1)

    print(f"[i] 將產生 {len(presets)} 個場景 → {OUT_DIR}\n")
    for i, p in enumerate(presets):
        out = os.path.join(OUT_DIR, f"{p['name']}.wav")
        seed = args.seed_base + i
        print(f"=== [{i+1}/{len(presets)}] {p['name']} — {p['label']} ===")
        cmd = [
            sys.executable, GENERATE,
            "--tags", p["tags"],
            "--instrumental",
            "--duration", str(p["duration"]),
            "--model", args.model,
            "--seed", str(seed),
            "--out", out,
            "--repo", args.repo,
        ]
        if args.print_cli:
            cmd.append("--print-cli")
        rc = subprocess.call(cmd)
        if rc != 0 and not args.print_cli:
            print(f"[!] {p['name']} 失敗 (rc={rc})，繼續下一個。\n")
        else:
            print()
    print("[OK] 批次完成。")


if __name__ == "__main__":
    main()
