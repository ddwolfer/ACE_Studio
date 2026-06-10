# engine-sfx — SFX 音效引擎（Stable Audio Open）

產 **0.5–8 秒離散音效**（金幣、跳躍、爆炸、UI 點擊…）。ACE-Step 最短只能做約 5 秒,短音效由這支負責。
選型比較、授權細節見 [docs/SFX-ENGINE.md](../docs/SFX-ENGINE.md)。

## 首次安裝（三步,只做一次）

### 1. 裝環境
```powershell
cd D:\AI\ACE_Studio
.\setup-sfx.ps1     # 建 venv + 裝 torch(CUDA)/diffusers 等,約下載 3GB
```

### 2. 接受模型授權（手動,瀏覽器）
Stable Audio Open 是 **gated model**:
1. 開 https://huggingface.co/stabilityai/stable-audio-open-1.0
2. 登入 HuggingFace（沒帳號先免費註冊）
3. 按 **「Agree and access repository」** 接受授權
4. 到 https://huggingface.co/settings/tokens 建一個 **Read** token 備用

### 3. 登入 HF
```powershell
engine-sfx\.venv\Scripts\hf.exe auth login    # 貼上剛剛的 token
```

## 啟動

```powershell
.\run-sfx.ps1       # 跑在 127.0.0.1:8002
```

- **第一次生成**會自動下載模型權重（~5GB）,之後走快取。
- 預設 `SFX_CPU_OFFLOAD=true`（8GB 顯存友善,與 ACE-Step 並存）。
- 想完全不占 VRAM:啟動前 `$env:SFX_DEVICE='cpu'`（慢,一顆音效數十秒）。

## API（統一合約）

| 端點 | 說明 |
|---|---|
| `GET /health` | `{ok, model_loaded, device}` |
| `POST /generate` | `{prompt, duration, seed, steps, cfg}` → `{audio_url, raw_path, duration, seed}` |
| `GET /audio?path=` | 播放（僅限 out/ 內檔案） |
| `POST /release` | 卸載模型,把 VRAM 還給 ACE-Step |

## ⚠️ 商用注意

- 年營收 **<$1M 免費商用**,但需要:
  1. 到 [Stability 授權頁](https://stability.ai/license) 完成社群授權註冊
  2. 產品內標註 **「Powered by Stability AI」**
- 不想掛字樣 → 備案 AudioGen（MIT 零條件,音質較差),見 docs/SFX-ENGINE.md §4b。
