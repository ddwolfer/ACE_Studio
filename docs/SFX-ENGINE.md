# 加入短音效引擎（雙引擎架構）

> 目標：ACE Studio 同一個面板，既能產 **BGM/氛圍**（ACE-Step），也能產 **0.5–2 秒離散音效**（金幣、跳躍、受傷、爆炸…）。
> ACE-Step 做不到 <5 秒短音（`DURATION_MIN`，見下），所以 SFX 交給專門的短音效模型。
> **預設 SFX 引擎：Stable Audio Open（音質佳）；備案：AudioGen（MIT 零授權條件）。**

---

## 1. 為什麼要第二個引擎

- ACE-Step 是「整段音樂」生成器，**最短約 5–10 秒**（`acestep/constants.py: DURATION_MIN=10`，no-LM 實測 ~5s）。
- 遊戲離散音效（金幣 ~0.5s、跳躍、UI 點擊）是另一種任務 → 用 **text-to-SFX** 模型。

## 2. 選哪個模型（已比較授權）

| 模型 | 短音效 | 音質 | 授權 / 商用 | 備註 |
|------|--------|------|-------------|------|
| **Stable Audio Open** ✅ 預設 | 0.5–47s | **高（44.1kHz 立體聲）** | Stability 社群授權：**<$1M 商用免費**，需註冊 + 在產品掛「Powered by Stability AI」；>$1M 需 Enterprise | 音質明顯較好；~1.3B + T5 文字編碼器 |
| **AudioGen (Meta)** 備案 | 1–5s | 中（16kHz 單聲道） | **MIT，零條件商用** | 高頻偏悶；`facebook/audiogen-medium` ~1.5B |
| TangoFlux | — | 高 | 研究用，不可商用 | ICLR 2026 |

→ **預設用 Stable Audio Open（音質佳）**；**AudioGen 當零條件備案**（不想掛字樣、或營收破 $1M 時切換）。
兩者都包成同一 `/generate` 合約，切換只是換後端。

來源：
- [Stable Audio Open（Stability 社群授權）](https://huggingface.co/stabilityai/stable-audio-open-1.0) · [Stability 授權條款](https://stability.ai/license)
- [AudioCraft / AudioGen (MIT)](https://github.com/facebookresearch/audiocraft) · [TangoFlux 授權](https://github.com/declare-lab/TangoFlux/blob/main/LICENSE.md)

---

## 3. 架構：可插拔的「引擎」介面

ACE Studio 不綁死單一引擎。前端依「類型」把請求路由到不同引擎，引擎都包成同一份合約。

```
前端（類型選擇：🎵 BGM / 🔊 SFX）
   └─ server/ 路由
        ├─ type=bgm → engine/      ACE-Step (acestep-api :8001)
        └─ type=sfx → engine-sfx/  SFX wrapper :8002（預設 Stable Audio Open / 備案 AudioGen）
```

**統一合約**（兩個引擎都要長這樣，前端只認這個）：
```
POST /generate
  { "prompt": "coin pickup, bright metallic ding", "duration": 1.5, "format": "wav", "seed": -1 }
→ { "audio_url": "/audio?path=...", "raw_path": "...", "duration": 1.5, "seed": 12345 }
```
- BGM 引擎：ACE-Step 已有 `acestep-api`（用既有 `/release_task`→`/query_result`，由 `server/` adapter 轉成上面的合約）。
- SFX 引擎：下面這支小 wrapper。

---

## 4. 接 Stable Audio Open（預設）

> ⚠️ SAO 是 **gated 模型**：先到 [HF 模型頁](https://huggingface.co/stabilityai/stable-audio-open-1.0) 登入、**接受授權**，並備妥 HF token。
> ⚠️ 商用務必：到 Stability 社群授權頁**註冊**，並在產品標註 **「Powered by Stability AI」**（年營收 >$1M 需改 Enterprise）。

### 4.1 安裝（獨立環境，避免和 ACE-Step 套件衝突）
```powershell
cd D:\AI\ACE_Studio
uv venv engine-sfx\.venv
engine-sfx\.venv\Scripts\python -m pip install diffusers transformers torch soundfile fastapi uvicorn huggingface_hub
# 下載 gated 權重需先登入（貼上 HF token）
engine-sfx\.venv\Scripts\huggingface-cli login
```

### 4.2 最小 wrapper：`engine-sfx/sfx_api.py`（用 diffusers 的 StableAudioPipeline）
```python
import os, torch, soundfile as sf
from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel
from diffusers import StableAudioPipeline

app = FastAPI(title="ACE Studio SFX (Stable Audio Open)")
OUT = os.path.join(os.path.dirname(__file__), "out"); os.makedirs(OUT, exist_ok=True)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
_pipe = None

def get_pipe():
    global _pipe
    if _pipe is None:
        _pipe = StableAudioPipeline.from_pretrained(
            "stabilityai/stable-audio-open-1.0",
            torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
        ).to(DEVICE)
    return _pipe

class GenReq(BaseModel):
    prompt: str
    duration: float = 1.5
    seed: int = -1
    steps: int = 100          # SAO 建議 100~200 步

@app.post("/generate")
def generate(req: GenReq):
    pipe = get_pipe()
    gen = torch.Generator(DEVICE)
    if req.seed >= 0:
        gen.manual_seed(req.seed)
    audio = pipe(
        prompt=req.prompt,
        negative_prompt="low quality, noise",
        num_inference_steps=req.steps,
        audio_end_in_s=max(0.5, min(req.duration, 47)),
        num_waveforms_per_prompt=1,
        generator=gen,
    ).audios
    wav = audio[0].T.float().cpu().numpy()         # [samples, 2] 立體聲
    path = os.path.join(OUT, f"sfx_{abs(hash(req.prompt))}.wav")
    sf.write(path, wav, pipe.vae.sampling_rate)    # 44100 Hz
    return {"audio_url": f"/audio?path={path}", "raw_path": path,
            "duration": req.duration, "seed": req.seed}

@app.get("/audio")
def audio(path: str):
    return FileResponse(path, media_type="audio/wav")
```

### 4.3 啟動（與 ACE-Step 引擎並存，不同 port）
```powershell
cd D:\AI\ACE_Studio\engine-sfx
.venv\Scripts\python -m uvicorn sfx_api:app --host 127.0.0.1 --port 8002
```

---

## 4b. 備案：AudioGen（MIT，零授權條件）

當你不想掛 Stability 字樣、或營收破 $1M 時改用。**介面完全相同**（同一 `/generate`），只換 wrapper 內的實作：
```powershell
engine-sfx\.venv\Scripts\python -m pip install audiocraft
```
```python
from audiocraft.models import AudioGen
from audiocraft.data.audio import audio_write
m = AudioGen.get_pretrained("facebook/audiogen-medium")
m.set_generation_params(duration=1.5)
wav = m.generate([prompt])[0].cpu()             # 16kHz 單聲道
audio_write(stem, wav, m.sample_rate, format="wav")   # 產生 stem.wav
```

---

## 5. ⚠️ 8GB 顯存：別同時載兩個模型

ACE-Step XL(4B) + SFX 模型（SAO ~1.3B / AudioGen ~1.5B）同時塞進 8GB 會 OOM。策略（擇一）：
1. **按需載入 / 用完釋放**（推薦）：切到 SFX 模式才載 SFX 模型，切回 BGM 釋放它（`del _pipe; torch.cuda.empty_cache()`）。
2. **SFX 放 CPU**：把 wrapper 的 `DEVICE='cpu'`，讓 GPU 專心給 ACE-Step。SAO 在 CPU 較慢（數十秒），AudioGen 較可接受；8GB 想保險可用。
3. 兩個引擎都開 offload。

> 建議：M1 先只做 BGM；SFX 引擎當獨立里程碑加入（見 IMPLEMENTATION-SPEC 路線圖 M6）。架構上 server adapter 一開始就用「統一 /generate 合約」，之後加 SFX 只是多註冊一個後端。

---

## 6. UI 影響（已寫入 FRONTEND-SPEC）

- **類型切換 🎵 BGM / 🔊 SFX**：切 SFX → 引擎換 SFX 模型（預設 SAO）、長度範圍變 0.5–8s、prompt 提示改聲音事件風（coin、jump、explosion…）、隱藏歌詞欄。
- **長度滑桿**：BGM 模式最小 5s（ACE-Step 底線）；SFX 模式 0.5–8s。
- **SFX 場景範本**：金幣 / 跳躍 / 受傷 / 爆炸 / 開門 / 腳步 / UI 點擊（對應 SFX 模型的英文 prompt）。
- 音檔庫每筆標 `type`（bgm/sfx）可篩選；批次可混。

---

## 7. SFX prompt 風格（描述「聲音事件」，非音樂 tags）

| 音效 | prompt |
|------|--------|
| 金幣 | `coin pickup, bright metallic ding, short` |
| 跳躍 | `cartoon jump boing, short` |
| 受傷 | `player hurt grunt impact, short` |
| 爆炸 | `explosion blast debris` |
| 開門 | `wooden door creak open` |
| 腳步 | `footsteps on wood, walking` |
| UI 點擊 | `ui button click beep, short` |
| 劍擊 | `metal sword clash clang` |

> SAO / AudioGen 都偏好描述「**聲音事件**」（不是音樂 tags）。SAO 還能用 `negative_prompt`（如 `low quality, noise`）去雜訊。短音設 `duration≈1~1.5`，必要時一樣可裁切。
