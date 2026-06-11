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

**Windows 一鍵**：雙擊 `start.cmd`（= 引擎 :8001 + 本機 helper :8787 + SFX 引擎 :8002 + 前端，各開一個視窗）。

```powershell
# 或個別啟動：
.\run-engine.ps1                 # BGM 引擎（macOS/Linux： bash run-engine.sh）
.\run-local.ps1                  # 本機 helper（開資料夾/裁切/音檔庫落地）
.\run-sfx.ps1                    # SFX 引擎（先跑過一次 setup-sfx.ps1）
cd frontend; npm run dev         # 前端
```

開 `http://localhost:5173` → 在介面按「初始化服務」→ 填曲風/歌詞/長度 → 生成。

## 用 Claude Code 操作（MCP，M5）

專案根目錄有 `.mcp.json`，在這個資料夾打開 Claude Code 就會自動載入 `ace-studio` MCP server（第一次需先 `cd mcp-server && npm install`）。服務照常用 `start.cmd` 開著，然後直接用自然語言下單：

> 幫我做一套 8-bit 風格音效包：金幣、跳躍、受傷各 2 個變化

Claude 會自動拆任務、寫英文 prompt、逐一呼叫生成工具；成品走同一條「裁切 → 落地 `library/`」管線，**app 作品庫 5 秒內自動出現**（不用重新整理）。可用工具：`generate_bgm`、`generate_sfx`、`list_library`、`remove_item`、`studio_status`。任何支援 MCP 的客戶端（Claude Desktop、Cursor…）都能掛同一個 server。

---

## 專案結構

```
ACE_Studio/
├── README.md            ← 你在這
├── start.cmd            ← Windows 一鍵啟動（雙擊）
├── setup.ps1 / setup.sh ← 一鍵安裝（裝引擎+模型+前端）
├── setup-sfx.ps1        ← SFX 引擎安裝（一次）
├── run-engine.* / run-local.* / run-sfx.ps1
├── .mcp.json            ← Claude Code 自動載入 MCP server
├── frontend/            ← React + Vite 前端
├── server/              ← 本機 helper :8787（開資料夾 / 裁靜音 / 音檔庫落地）
├── mcp-server/          ← MCP server（Claude Code 等 AI 客戶端驅動生成）
├── engine-sfx/          ← SFX 引擎 :8002（Stable Audio Open；.venv 與 out/ gitignore）
├── docs/                ← 所有文件（見下）
├── design/              ← 設計稿來源說明（frontend.pen）
├── engine/              ← (gitignore) ACE-Step 引擎 + 模型，由 setup 安裝
└── library/             ← (gitignore) 音檔庫落地（library.json + audio/）
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
- [x] **M1**：走通單首生成（前端 + dev proxy + 播放器 + 音檔庫）
- [x] **M2**：場景/模板 + 統一佇列 + 自動裁切 + 一鍵啟動
- [x] **M3**：音檔庫落地磁碟 + 設定 modal
- [x] **M4**：SFX 引擎（Stable Audio Open）+ BGM/SFX 切換 → 同面板產 BGM 與音效
- [x] **M5**：MCP 接口——用 Claude Code 自然語言驅動生成（`mcp-server/` + `.mcp.json`）
- 內建聊天面板（M5b）與定時排程（原 M6）：不排（M6 已取消；M5b 視使用情況再議）

---

## 授權

ACE Studio 程式碼：MIT。
引擎 [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5)（MIT）為**獨立安裝**、非本專案重新散布。
