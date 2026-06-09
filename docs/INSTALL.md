# 安裝 ACE-Step 1.5 XL（Windows / CUDA）

> 你的環境：Windows 11，建議有 NVIDIA GPU（≥12GB VRAM；8GB 也能跑但要開 offload）。
> 沒有 GPU 也能用 CPU，但慢很多，不建議量產。

---

## 路線 A — 官方 Python 安裝（CLI 自動化首選）

### 1. 先裝 uv（官方用 uv 管理環境）
```powershell
# 用 PowerShell 安裝 uv
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. 取得程式碼
```powershell
cd D:\AI
git clone https://github.com/ace-step/ACE-Step-1.5.git
cd ACE-Step-1.5
```

### 3. 安裝相依套件（含 CUDA 版 PyTorch）
```powershell
uv sync
# 若要指定 CUDA 版本，依官方 README 指定 torch index，例如 cu124
```

### 4. 下載模型權重
```powershell
# 列出所有可下載模型
uv run acestep-download --list

# 下載 XL Turbo（日常做 BGM 首選）+ 預設語言模型
uv run acestep-download --model acestep-v15-xl-turbo

# 想要最高品質再加：
uv run acestep-download --model acestep-v15-xl-sft

# 全下載（佔空間大）：
uv run acestep-download --all
```
> 權重會放到 `checkpoints/` 資料夾。

### 5. 啟動官方 Web UI（最簡單的試用方式）
```powershell
uv run acestep
# 或啟動 Gradio UI（依官方 README 指令，通常是 acestep --ui 或 python -m acestep.gui）
```
瀏覽器開 `http://127.0.0.1:7860`，在 tags 與 lyrics 欄輸入 → Generate。

### 6. 用本包的腳本（接 ACE-Step 的 Python API）
把本資料夾的 `scripts/` 複製到 ACE-Step-1.5 專案根目錄，或在腳本內把
`ACESTEP_REPO` 路徑指向你 clone 的位置。詳見 `scripts/generate.py` 開頭註解。

---

## 路線 B — ComfyUI 安裝

### 1. 先有 ComfyUI
若還沒裝：
```powershell
cd D:\AI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
# 依 ComfyUI 官方 README 建環境並安裝 requirements
```

### 2. 安裝 ACE-Step 自訂節點（兩種方式）

**方式一（推薦）：ComfyUI Manager**
- 開 ComfyUI → Manager → Install Custom Nodes → 搜尋 `ACE-Step` → Install → 重啟。

**方式二：手動 clone**
```powershell
cd D:\AI\ComfyUI\custom_nodes
git clone https://github.com/ace-step/ACE-Step-ComfyUI.git
cd ACE-Step-ComfyUI
pip install -r requirements.txt
# 重啟 ComfyUI
```
> 註：ComfyUI **原生**已內建 ACE-Step 節點（`TextEncodeAceStepAudio`、`EmptyAceStepLatentAudio`），
> 只用原生 1.5 / XL 文字生成音樂時，不一定需要自訂節點。自訂節點提供 cover / repaint / LLM 規劃等進階功能。

### 3. 放模型檔
| 檔案 | 放到 |
|------|------|
| `ace_step_v1_3.5b.safetensors`（或 XL 對應權重） | `ComfyUI/models/checkpoints/` |
| 中文 rap LoRA（選用）`ace-step-v1-chinese-rap-lora.safetensors` | `ComfyUI/models/loras/` |
| XL VAE / text encoder（依 workflow 要求） | `ComfyUI/models/vae/`、`ComfyUI/models/text_encoders/` |

> XL workflow 第一次載入時，ComfyUI 會在節點上標出缺哪個檔，照著缺檔名去 Hugging Face
> `ace-step` 組織下載對應 safetensors 即可。

### 4. 載入 workflow
- 把 `comfyui/` 內的 workflow JSON 拖進 ComfyUI 視窗即可（見 `COMFYUI-GUIDE.md`）。
- 或直接用官方範本：ComfyUI 選單 → Workflow → Browse Templates → Audio → ACE-Step 1.5 XL。

---

## VRAM 不足怎麼辦
- 用 `xl-turbo`（8 步）而非 sft/base（50 步）。
- 開 model offload（官方參數 / ComfyUI 啟動加 `--lowvram`）。
- 縮短 `duration`（先做 30 秒測 prompt，定稿再拉長）。
- 語言模型選 `0.6B` 或直接「No LM」（自己當 planner，只填 tags）。

---

## 驗證安裝成功
```powershell
python scripts/generate.py --tags "lo-fi hip hop, chill, piano, vinyl crackle, 85 BPM" --instrumental --duration 20 --out test.wav
```
聽到 `test.wav` 是一段 lo-fi 純音樂即代表整條鏈路 OK。
