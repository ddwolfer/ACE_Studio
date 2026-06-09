# 🎵 ACE Studio

> 用文字快速產生**遊戲背景音樂 (BGM) 與音效**的本地工具。
> 深色音樂工作站 (DAW) 風格介面，底層由開源的 [ACE-Step 1.5 XL](https://github.com/ace-step/ACE-Step-1.5) 音樂模型驅動。

把「描述一段音樂 → 生成 → 試聽 → 管理」整個流程做成一個好用的介面，並可選用 **Claude AI 助手**直接用講的下需求。

---

## 這是什麼 / 架構

ACE Studio 是**前端產品**；ACE-Step 是它連線使用的**引擎**（兩者解耦，引擎不進版控）。

```
┌──────────────────────┐  HTTP   ┌───────────────────────┐
│ 前端 (React+Vite)     │ ──────▶ │ engine/  ACE-Step API  │  ← 127.0.0.1:8001
│ 單首/批次/定時/模板    │         │ (acestep-api, 含模型)   │
│ 音檔庫 + 波形播放器    │         └───────────────────────┘
│ AI 助手聊天           │  HTTP
└─────────┬────────────┘ ──────▶ ┌───────────────────────┐
          │ /chat (tool-use)      │ server/ Claude 代理     │ ─▶ Anthropic API
          └──────────────────────▶│ + 開檔總管 + 音檔庫寫檔 │
                                   └───────────────────────┘
```

---

## 需求

- **Windows / macOS / Linux**；建議 **NVIDIA GPU ≥ 8GB VRAM**（8GB 用 XL Turbo + offload 可跑）。
- [uv](https://docs.astral.sh/uv/)（Python 環境管理，setup 會自動裝）
- **Node.js 18+**（前端）
- **ffmpeg**（音訊輸出）

---

## 一鍵安裝

```powershell
git clone <你的-repo-url> ACE_Studio
cd ACE_Studio
# Windows
powershell -ExecutionPolicy Bypass -File .\setup.ps1
# macOS / Linux： bash setup.sh
```

`setup` 會：把 ACE-Step 引擎裝到 `engine/`（已存在則略過）→ `uv sync` → 下載 **XL Turbo** 模型 → 裝前端相依 → 建立 `.env`。

> 模型權重會下載到 `engine/checkpoints/`（數 GB），**不會進版控**。

---

## 啟動

```powershell
# 1) 啟動引擎 API
.\run-engine.ps1                 # macOS/Linux： bash run-engine.sh

# 2) 啟動前端（前端完成後）
cd frontend
npm run dev
```

開 `http://localhost:5173` → 在介面按「初始化服務」→ 填曲風/歌詞/長度 → 生成。

---

## 專案結構

```
ACE_Studio/
├── README.md            ← 你在這
├── setup.ps1 / setup.sh ← 一鍵安裝（裝引擎+模型+前端）
├── run-engine.* / .env.example
├── frontend/            ← React + Vite 前端（依設計稿實作）
├── server/              ← 本機薄代理：Claude /chat + 開檔總管 + 音檔庫寫檔（含可選排程器）
├── docs/                ← 所有文件（見下）
├── design/              ← 設計稿來源說明（frontend.pen）
├── engine/              ← (gitignore) ACE-Step 引擎 + 模型，由 setup 安裝
└── outputs/             ← (gitignore) 生成音檔 + library.json
```

---

## 文件

| 文件 | 內容 |
|------|------|
| [docs/IMPLEMENTATION-SPEC.md](docs/IMPLEMENTATION-SPEC.md) | **實作技術規格**：已確認的 acestep-api 端點、欄位對應、選型、里程碑（開發看這份） |
| [docs/FRONTEND-SPEC.md](docs/FRONTEND-SPEC.md) | 前端設計需求書：佈局、配色、元件文字、prompt 合成模型、AI 助手 |
| [docs/PROMPT-GUIDE.md](docs/PROMPT-GUIDE.md) | Prompt 撰寫指南（遊戲 BGM / 音效配方） |
| [docs/WEB-UI-GUIDE.md](docs/WEB-UI-GUIDE.md) | ACE-Step 原生 Web UI 名詞白話說明（含 8GB 建議設定） |
| [docs/COMFYUI-GUIDE.md](docs/COMFYUI-GUIDE.md) | ComfyUI 節點串接教學 |
| [docs/SFX-ENGINE.md](docs/SFX-ENGINE.md) | 加入短音效引擎（雙引擎，預設 Stable Audio Open / 備案 AudioGen）+ 授權比較（商用看這份） |
| [docs/README.md](docs/README.md) | 研究總覽 + CLI 工具（`docs/scripts/`，實際跑在 `engine/scripts/`） |
| docs/prompts/ | 場景/音效 prompt 範例庫 |

> 可直接用 CLI 量產：引擎內 `engine/scripts/`（`uv run python scripts\generate.py ...`，見 docs/INSTALL.md）。

---

## 開發狀態

- [x] 研究 ACE-Step、prompt 指南、ComfyUI 教學
- [x] UI 設計稿（Pencil）+ 設計/實作規格
- [x] 專案結構（引擎解耦、可上 GitHub）
- [ ] **M1**：走通單首生成（前端 + dev proxy + 播放器 + 音檔庫）
- [ ] M2：場景/模板 + 批次　/　M3：開檔總管+複製prompt+設定　/　M4：AI 助手　/　M5：定時排程
- [ ] **M6**：SFX 引擎（預設 Stable Audio Open / 備案 AudioGen）+ BGM/SFX 類型切換 → 同面板產 BGM 與音效

---

## 授權

ACE Studio 程式碼：MIT。
引擎 [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5)（MIT）為**獨立安裝**、非本專案重新散布。
