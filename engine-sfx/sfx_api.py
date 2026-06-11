"""ACE Studio SFX 引擎（預設 Stable Audio Open，:8002）

統一合約（與 docs/SFX-ENGINE.md §3 一致）：
  GET  /health    -> {ok, engine, model_loaded, device}
  POST /generate  -> {audio_url, raw_path, duration, seed}
  GET  /audio?path=...（只允許 out/ 內的檔案）
  POST /release   -> 釋放模型（還 VRAM 給 ACE-Step）

8GB 顯存策略（SFX-ENGINE.md §5）：
  - 模型按需載入（第一次 /generate 才載），用 /release 釋放
  - SFX_CPU_OFFLOAD=true（預設）→ enable_model_cpu_offload，僅推論中的子模組進 GPU
  - SFX_DEVICE=cpu 可整個放 CPU（慢但零 VRAM）

⚠️ stabilityai/stable-audio-open-1.0 是 gated model：
  需先在 HF 模型頁接受授權 + `hf auth login`（見 engine-sfx/README.md）。
商用需在 Stability 註冊並標註 "Powered by Stability AI"。
"""
import os
import gc
import uuid

import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

MODEL_ID = "stabilityai/stable-audio-open-1.0"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(OUT, exist_ok=True)

def _pick_device() -> str:
    if os.environ.get("SFX_DEVICE"):
        return os.environ["SFX_DEVICE"]
    if torch.cuda.is_available():
        return "cuda"
    mps = getattr(torch.backends, "mps", None)
    if mps is not None and mps.is_available():
        return "mps"  # Apple Silicon
    return "cpu"


DEVICE = _pick_device()
CPU_OFFLOAD = os.environ.get("SFX_CPU_OFFLOAD", "true").lower() == "true"

app = FastAPI(title="ACE Studio SFX (Stable Audio Open)")
app.add_middleware(  # 開發期 CORS 全開（正式走 Vite proxy /sfx）
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

_pipe = None


def get_pipe():
    global _pipe
    if _pipe is None:
        from diffusers import StableAudioPipeline

        pipe = StableAudioPipeline.from_pretrained(
            MODEL_ID,
            # MPS 用 fp32：fp16 在部分 mac 上會出 NaN/無聲
            torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
        )
        if DEVICE == "cuda" and CPU_OFFLOAD:
            pipe.enable_model_cpu_offload()  # 子模組輪流進 GPU，8GB 友善（僅 CUDA 支援）
        else:
            pipe = pipe.to(DEVICE)
        _pipe = pipe
    return _pipe


class GenReq(BaseModel):
    prompt: str
    duration: float = 1.5
    seed: int = -1
    steps: int = 100  # SAO 建議 100~200
    cfg: float = 7.0
    negative_prompt: str = "low quality, noise"


@app.get("/health")
def health():
    return {
        "ok": True,
        "engine": "stable-audio-open",
        "model_loaded": _pipe is not None,
        "device": DEVICE,
        "cpu_offload": CPU_OFFLOAD,
    }


@app.post("/generate")
def generate(req: GenReq):
    if not req.prompt.strip():
        raise HTTPException(400, "prompt 不可為空")
    pipe = get_pipe()
    seed = req.seed if req.seed >= 0 else int.from_bytes(os.urandom(4), "little")
    gen = torch.Generator("cuda" if DEVICE == "cuda" else "cpu").manual_seed(seed)
    result = pipe(
        prompt=req.prompt,
        negative_prompt=req.negative_prompt or None,
        num_inference_steps=max(20, min(req.steps, 300)),
        guidance_scale=req.cfg,
        audio_end_in_s=max(0.5, min(req.duration, 47.0)),
        num_waveforms_per_prompt=1,
        generator=gen,
    )
    wav = result.audios[0].T.float().cpu().numpy()  # [samples, 2] 44.1kHz 立體聲
    path = os.path.join(OUT, f"sfx_{uuid.uuid4().hex[:12]}.wav")
    sf.write(path, wav, pipe.vae.sampling_rate)
    return {
        "audio_url": f"/audio?path={path}",
        "raw_path": path,
        "duration": req.duration,
        "seed": seed,
    }


@app.get("/audio")
def audio(path: str):
    # 只允許讀 out/ 內的檔案（防 path traversal）
    real = os.path.realpath(path)
    if not real.startswith(os.path.realpath(OUT) + os.sep) or not os.path.isfile(real):
        raise HTTPException(404, "not found")
    return FileResponse(real, media_type="audio/wav")


@app.post("/release")
def release():
    """釋放模型，把 VRAM 還給 ACE-Step（下次 /generate 會重載）。"""
    global _pipe
    _pipe = None
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    elif hasattr(torch, "mps") and hasattr(torch.mps, "empty_cache"):
        torch.mps.empty_cache()
    return {"ok": True}


def main():
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8002, workers=1)


if __name__ == "__main__":
    main()
