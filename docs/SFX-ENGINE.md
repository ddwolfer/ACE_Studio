# 加入短音效引擎（雙引擎架構）

> 目標：ACE Studio 同一個面板，既能產 **BGM/氛圍**（ACE-Step），也能產 **1–2 秒離散音效**（金幣、跳躍、受傷、爆炸…）。
> ACE-Step 做不到 <5 秒短音（`DURATION_MIN`，見下），所以 SFX 交給專門的短音效模型。

---

## 1. 為什麼要第二個引擎

- ACE-Step 是「整段音樂」生成器，**最短約 5–10 秒**（`acestep/constants.py: DURATION_MIN=10`，no-LM 實測 ~5s）。
- 遊戲離散音效（金幣 ~0.5s、跳躍、UI 點擊）是另一種任務 → 用 **text-to-SFX** 模型。

## 2. 選哪個模型（已比較授權）

| 模型 | 短音效 | 授權 | 商用 | 備註 |
|------|--------|------|------|------|
| **AudioGen (Meta AudioCraft)** ✅ 推薦 | 1–5s 環境音/Foley | **MIT** | ✅ | 商用安全；品質中上；`facebook/audiogen-medium` ~1.5B |
| Stable Audio Open | 高品質 SFX | Stability 社群授權 | ❌ 需另購 | 非商用研究可用 |
| TangoFlux | 高品質 | 研究用 | ❌ | ICLR 2026，不可商用 |

→ **遊戲商用採用 AudioGen**。若你純自用/不商用，可改用 Stable Audio Open（品質更好），架構完全相同、只換 wrapper。

來源：
- [AudioCraft / AudioGen (MIT)](https://github.com/facebookresearch/audiocraft) · [AudioGen 文件](https://facebookresearch.github.io/audiocraft/docs/AUDIOGEN.html)
- [Stable Audio Open (Stability 社群授權)](https://huggingface.co/stabilityai/stable-audio-open-1.0) · [TangoFlux 授權](https://github.com/declare-lab/TangoFlux/blob/main/LICENSE.md)

---

## 3. 架構：可插拔的「引擎」介面

ACE Studio 不綁死單一引擎。前端依「類型」把請求路由到不同引擎，引擎都包成同一份合約。

```
前端（類型選擇：🎵 BGM / 🔊 SFX）
   └─ server/ 路由
        ├─ type=bgm → engine/      ACE-Step (acestep-api :8001)
        └─ type=sfx → engine-sfx/  AudioGen wrapper (:8002)
```

**統一合約**（兩個引擎都要長這樣，前端只認這個）：
```
POST /generate
  { "prompt": "coin pickup chime", "duration": 1.5, "format": "wav", "seed": -1 }
→ { "audio_url": "/audio?path=...", "raw_path": "...", "duration": 1.5, "seed": 12345 }
```
- BGM 引擎：ACE-Step 已有 `acestep-api`（用既有 `/release_task`→`/query_result`，由 `server/` adapter 轉成上面的合約）。
- SFX 引擎：下面這支小 wrapper。

---

## 4. 接 AudioGen（實作步驟）

### 4.1 安裝（獨立環境，避免和 ACE-Step 套件衝突）
```powershell
cd D:\AI\ACE_Studio
uv venv engine-sfx\.venv
engine-sfx\.venv\Scripts\python -m pip install audiocraft fastapi uvicorn soundfile
```

### 4.2 最小 wrapper：`engine-sfx/sfx_api.py`
```python
import io, os, tempfile, torch
from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel
from audiocraft.models import AudioGen
from audiocraft.data.audio import audio_write

app = FastAPI(title="ACE Studio SFX (AudioGen)")
_model = None
OUT = os.path.join(os.path.dirname(__file__), "out"); os.makedirs(OUT, exist_ok=True)

def get_model():
    global _model
    if _model is None:
        _model = AudioGen.get_pretrained("facebook/audiogen-medium")
    return _model

class GenReq(BaseModel):
    prompt: str
    duration: float = 1.5      # AudioGen 可做 1~5s 短音效
    seed: int = -1

@app.post("/generate")
def generate(req: GenReq):
    if req.seed >= 0:
        torch.manual_seed(req.seed)
    m = get_model()
    m.set_generation_params(duration=max(0.5, min(req.duration, 8)))
    wav = m.generate([req.prompt])[0].cpu()  # [C, T]
    stem = os.path.join(OUT, "sfx_%d" % abs(hash(req.prompt)) )
    audio_write(stem, wav, m.sample_rate, format="wav")  # 產生 stem.wav
    path = stem + ".wav"
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

## 5. ⚠️ 8GB 顯存：別同時載兩個模型

ACE-Step XL(4B) + AudioGen(1.5B) 同時塞進 8GB 會 OOM。策略（擇一）：
1. **按需載入 / 用完釋放**：切到 SFX 模式才載 AudioGen，切回 BGM 釋放它（`del _model; torch.cuda.empty_cache()`）。
2. **AudioGen 放 CPU**：短音效在 CPU 也只要幾秒，把 SFX wrapper 設 `device='cpu'`，讓 GPU 專心給 ACE-Step。← 8GB 最穩。
3. 兩個引擎都開 offload。

> 建議：M1 先只做 BGM；SFX 引擎當獨立里程碑加入（見 IMPLEMENTATION-SPEC 路線圖 M6）。架構上 server adapter 一開始就用「統一 /generate 合約」，之後加 SFX 只是多註冊一個後端。

---

## 6. UI 影響（已寫入 FRONTEND-SPEC）

- **類型切換 🎵 BGM / 🔊 SFX**：切 SFX → 引擎換 AudioGen、長度範圍變 0.5–8s、prompt 提示改 Foley 風（coin、jump、explosion…）、隱藏歌詞欄。
- **長度滑桿**：BGM 模式最小 5s（ACE-Step 底線）；SFX 模式 0.5–8s。
- **SFX 場景範本**：金幣 / 跳躍 / 受傷 / 爆炸 / 開門 / 腳步 / UI 點擊（對應 AudioGen 風格的英文 prompt）。
- 音檔庫每筆標 `type`（bgm/sfx）可篩選；批次可混。

---

## 7. SFX prompt 風格（AudioGen 偏好「描述聲音事件」）

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

> AudioGen 描述「**聲音事件**」效果最好（不是音樂 tags）。短音設 `duration≈1~1.5`，必要時一樣可裁切。
