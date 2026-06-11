# 🎵 ACE Studio

**繁體中文** | [English](README.en.md)

> 用文字快速產生**遊戲背景音樂 (BGM) 與音效 (SFX)** 的本地工具。
> 深色音樂工作站 (DAW) 風格介面；BGM 由開源 [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5) 驅動，短音效由 [Stable Audio Open](https://huggingface.co/stabilityai/stable-audio-open-1.0) 驅動，並可透過 **MCP** 讓 Claude Code 用自然語言下單。

---

## 這是什麼 / 架構

ACE Studio 是**前端產品**；兩個生成引擎是它連線使用的**外部服務**（解耦，引擎不進版控）。

```
┌─────────────────────┐  /api   ┌──────────────────────────────┐
│ 前端 React+Vite      │ ──────▶ │ engine/      ACE-Step (BGM)   │ :8001
│ :5173               │  /sfx   ├──────────────────────────────┤
│ BGM/SFX 切換、佇列    │ ──────▶ │ engine-sfx/  Stable Audio(SFX)│ :8002
│ 音檔庫、波形播放器     │  HTTP   ├──────────────────────────────┤
└─────────────────────┘ ──────▶ │ server/      本機 helper       │ :8787
                                 │ （裁靜音/落地音檔庫/開資料夾）   │
   Claude Code ──MCP(stdio)──▶  └──────────────────────────────┘
   （mcp-server/，自然語言生成，打同樣三個服務）
```

---

## 需求

- **Windows / macOS / Linux**
  - Windows/Linux：建議 **NVIDIA GPU ≥ 8GB VRAM**（8GB 開 offload 可跑，腳本已內建）
  - macOS：Apple Silicon 走 **MPS**（速度較慢但可用；引擎另有 `engine/start_api_server_macos.sh`）
- [uv](https://docs.astral.sh/uv/)（Python 環境管理，setup 會自動裝）
- **Node.js 18+**（前端 / helper / MCP）
- **ffmpeg**（音訊輸出）

---

## 從 clone 到跑起來

```powershell
git clone https://github.com/ddwolfer/ACE_Studio.git
cd ACE_Studio

# 1) 主程式（BGM 引擎 + 模型 + 前端）
powershell -ExecutionPolicy Bypass -File .\setup.ps1   # macOS/Linux： bash setup.sh

# 2)（可選）SFX 引擎——要產 0.5–8 秒短音效才需要
.\setup-sfx.ps1                                        # macOS/Linux： bash setup-sfx.sh
#    然後兩步手動授權（gated 模型，詳見 engine-sfx/README.md）：
#    a. 登入 HF 到模型頁按「Agree and access repository」
#    b. engine-sfx\.venv\Scripts\hf.exe auth login     # mac: engine-sfx/.venv/bin/hf

# 3)（可選）Claude Code MCP 接口
cd mcp-server; npm install; cd ..
```

`setup` 會：clone ACE-Step 引擎到 `engine/` → `uv sync` → 下載 v15-turbo 模型（2B，8GB 友善）→ 裝前端相依。

> 模型權重下載到 `engine/checkpoints/`（數 GB）與 HF cache，**不進版控**。

---

## 啟動

- **Windows**：雙擊 `start.cmd`（= BGM 引擎 :8001 + helper :8787 + SFX :8002 + 前端，各開一個視窗）
- **macOS / Linux**：`bash start.sh`（同樣全開，背景執行，Ctrl-C 一起關）

```powershell
# 或個別啟動：
.\run-engine.ps1                 # BGM 引擎（macOS/Linux： bash run-engine.sh）
.\run-local.ps1                  # 本機 helper（macOS/Linux： bash run-local.sh）
.\run-sfx.ps1                    # SFX 引擎（macOS/Linux： bash run-sfx.sh）
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
├── README.md / README.en.md ← 你在這（中 / 英）
├── CLAUDE.md                ← AI 助手（Claude Code 等）開專案自動讀的導覽
├── start.cmd / start.sh     ← 一鍵啟動（Windows 雙擊 / mac·Linux bash）
├── setup.ps1 / setup.sh     ← 一鍵安裝（裝引擎+模型+前端）
├── setup-sfx.ps1 / .sh      ← SFX 引擎安裝（一次）
├── run-engine.* / run-local.* / run-sfx.*
├── .mcp.json                ← Claude Code 自動載入 MCP server
├── frontend/                ← React + Vite 前端
├── server/                  ← 本機 helper :8787（開資料夾 / 裁靜音 / 音檔庫落地）
├── mcp-server/              ← MCP server（Claude Code 等 AI 客戶端驅動生成）
├── engine-sfx/              ← SFX 引擎 :8002（Stable Audio Open；.venv 與 out/ gitignore）
├── docs/                    ← 所有文件（見下）
├── design/                  ← 設計稿來源說明（frontend.pen）
├── engine/                  ← (gitignore) ACE-Step 引擎 + 模型，由 setup 安裝
└── library/                 ← (gitignore) 音檔庫落地（library.json + audio/）
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
