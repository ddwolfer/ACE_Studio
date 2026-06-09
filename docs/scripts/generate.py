#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
generate.py — ACE-Step 1.5 XL 無頭(headless)文字生成音樂 CLI

【怎麼執行 — 重要】
  acestep / torch 裝在 uv 管理的虛擬環境裡，務必用 `uv run python` 執行：
      cd D:\\AI\\ACE-Step-1.5
      uv run python scripts\\generate.py --tags "..." --instrumental --duration 60 --out battle.wav

  直接 `python generate.py` 會 import 失敗（系統 python 沒裝 acestep/torch）。

【本腳本怎麼運作】
  它呼叫 ACE-Step 真正的內部 API（不是開 Gradio 網頁）：
    acestep.handler.AceStepHandler   → 載入 DiT 主模型
    acestep.llm_inference.LLMHandler → 載入 5Hz 語言模型（可用 --no-lm 跳過）
    acestep.inference.generate_music → 實際生成
  對應關係：
    --tags        → GenerationParams.caption（主提示，曲風/樂器/情緒/BPM）
    --instrumental→ instrumental=True 且 lyrics 預設 "[Instrumental]"
    --out 副檔名  → 輸出格式（.wav / .flac / .mp3 ...）

  已下載且可用的 config_path（= --model）：acestep-v15-xl-turbo / acestep-v15-xl-sft
  （turbo 8 步最快；sft 50 步品質高、吃 CFG）

範例：
  uv run python scripts\\generate.py \
      --tags "epic orchestral battle, war drums, brass, 140 BPM, instrumental" \
      --instrumental --duration 60 --out battle.wav
  低顯存 / 想更快：加 --no-lm（關閉語言模型規劃，你自己當 planner）
"""
import argparse
import os
import sys


def build_args():
    p = argparse.ArgumentParser(description="ACE-Step 1.5 XL headless text-to-music")
    p.add_argument("--tags", required=True, help="主提示(caption)：曲風/樂器/情緒/BPM，逗號分隔")
    p.add_argument("--lyrics", default=None, help="歌詞/結構標籤；純音樂自動填 [Instrumental]")
    p.add_argument("--instrumental", action="store_true", help="純音樂模式")
    p.add_argument("--duration", type=float, default=60.0, help="長度(秒)，10~600；<0=自動")
    p.add_argument("--model", default="acestep-v15-xl-turbo",
                   help="config_path，例 acestep-v15-xl-turbo / acestep-v15-xl-sft")
    p.add_argument("--steps", type=int, default=None, help="去噪步數；turbo 預設 8、其他 50")
    p.add_argument("--cfg", type=float, default=7.0, help="guidance scale（非 turbo 才有效）")
    p.add_argument("--shift", type=float, default=1.0)
    p.add_argument("--infer-method", default="ode", choices=["ode", "sde"])
    p.add_argument("--bpm", type=int, default=None)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--no-lm", action="store_true",
                   help="不載入語言模型(thinking=False)，更省顯存更快")
    p.add_argument("--lm-model", default=None, help="指定 5Hz LM 名稱(預設自動挑)")
    p.add_argument("--device", default="auto", help="auto / cuda / cpu / mps")
    p.add_argument("--out", default="output.wav", help="輸出檔(副檔名決定格式)")
    p.add_argument("--outdir", default=None, help="輸出資料夾(預設 ./gen_outputs)")
    return p.parse_args()


def main():
    a = build_args()
    if a.steps is None:
        a.steps = 8 if "turbo" in a.model else 50
    lyrics = a.lyrics if a.lyrics else "[Instrumental]"
    fmt = os.path.splitext(a.out)[1].lstrip(".").lower() or "wav"
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    outdir = os.path.abspath(a.outdir or os.path.join(project_root, "gen_outputs"))
    os.makedirs(outdir, exist_ok=True)

    # ---- import 真正的 ACE-Step API ----
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    from acestep.handler import AceStepHandler
    from acestep.llm_inference import LLMHandler
    from acestep.inference import generate_music, GenerationParams, GenerationConfig
    from acestep.gpu_config import (
        get_gpu_config, set_global_gpu_config, is_mps_platform,
        VRAM_AUTO_OFFLOAD_THRESHOLD_GB,
    )

    # ---- GPU 設定 / offload 自動判斷（與官方一致）----
    gpu_config = get_gpu_config()
    set_global_gpu_config(gpu_config)
    gpu_gb = gpu_config.gpu_memory_gb
    auto_offload = (not is_mps_platform()) and gpu_gb > 0 and gpu_gb < VRAM_AUTO_OFFLOAD_THRESHOLD_GB
    print(f"[i] GPU {gpu_gb:.1f}GB  offload={auto_offload}  model={a.model}  steps={a.steps}")
    print(f"[i] caption: {a.tags}")
    print(f"[i] lyrics : {lyrics!r}  duration={a.duration}s  seed={a.seed}  LM={'off' if a.no_lm else 'on'}")

    # ---- 初始化 DiT 主模型 ----
    dit = AceStepHandler()
    use_fa = dit.is_flash_attention_available(a.device)
    print(f"[i] 載入 DiT 模型 {a.model} ...（首次會比較久）")
    status, ok = dit.initialize_service(
        project_root=project_root,
        config_path=a.model,
        device=a.device,
        use_flash_attention=use_fa,
        compile_model=False,
        offload_to_cpu=auto_offload,
        offload_dit_to_cpu=auto_offload,
        quantization=None,
        prefer_source=None,
    )
    if not ok:
        print(f"[!] DiT 初始化失敗：{status}", file=sys.stderr)
        sys.exit(1)
    print("[OK] DiT 就緒")

    # ---- 初始化語言模型（可跳過）----
    llm = LLMHandler()
    thinking = not a.no_lm
    if thinking:
        lm_name = a.lm_model
        if lm_name is None:
            avail = llm.get_available_5hz_lm_models()
            lm_name = avail[0] if avail else None
        if lm_name:
            ckpt_dir = os.path.join(project_root, "checkpoints")
            print(f"[i] 載入 5Hz LM {lm_name} ...")
            lm_status, lm_ok = llm.initialize(
                checkpoint_dir=ckpt_dir, lm_model_path=lm_name,
                backend=None, device=a.device, offload_to_cpu=auto_offload, dtype=None,
            )
            if not lm_ok:
                print(f"[!] LM 初始化失敗，改用 no-LM：{lm_status}", file=sys.stderr)
                thinking = False
            else:
                print("[OK] LM 就緒")
        else:
            print("[!] 找不到 LM 模型，改用 no-LM")
            thinking = False

    # ---- 組參數並生成 ----
    params = GenerationParams(
        task_type="text2music",
        caption=a.tags,
        lyrics=lyrics,
        instrumental=bool(a.instrumental),
        duration=a.duration,
        bpm=a.bpm,
        inference_steps=a.steps,
        guidance_scale=a.cfg,
        shift=a.shift,
        infer_method=a.infer_method,
        seed=a.seed,
        thinking=thinking,
    )
    config = GenerationConfig(
        batch_size=1,
        use_random_seed=False,
        seeds=[a.seed],
        audio_format=fmt if fmt in ("mp3", "wav", "flac", "wav32", "opus", "aac") else "wav",
    )

    print("[i] 開始生成 ...")
    result = generate_music(dit, llm, params, config, save_dir=outdir)

    if not result.success:
        print(f"[!] 生成失敗：{result.error}", file=sys.stderr)
        sys.exit(2)

    # ---- 回報輸出檔 ----
    print(f"[OK] {result.status_message}")
    printed = False
    for item in result.audios:
        if isinstance(item, dict):
            for k in ("audio_path", "path", "filename", "file", "output_path"):
                if item.get(k):
                    print(f"[OK] 輸出：{item[k]}")
                    printed = True
                    break
    if not printed:
        print(f"[OK] 音檔已存到資料夾：{outdir}")
        print(f"     audios 原始資料：{result.audios}")


if __name__ == "__main__":
    main()
