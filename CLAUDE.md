# ACE Studio — AI 助手導覽（Claude Code 自動讀取）

本機 web app:用文字生成遊戲 BGM(ACE-Step)與短音效(Stable Audio Open)。
規格正本在 `docs/IMPLEMENTATION-SPEC.md`,遇到「該怎麼接 / 欄位長怎樣」先查它。

## 服務一覽(全部綁 127.0.0.1)

| 服務 | Port | 啟動 | 健康檢查 |
|------|------|------|----------|
| ACE-Step BGM 引擎 | 8001 | `run-engine.ps1` / `.sh` | `GET /health`(回應外層是 `{data,code,error}` 信封) |
| Stable Audio SFX 引擎 | 8002 | `run-sfx.ps1` / `.sh` | `GET /health` |
| 本機 helper(Node 零相依) | 8787 | `run-local.ps1` / `.sh` | `GET /health` |
| 前端 Vite dev | 5173 | `cd frontend && npm run dev` | — |

一鍵全開:Windows `start.cmd`(雙擊)/ mac·Linux `bash start.sh`。

## 第一次安裝(幫使用者架服務時照這個順序)

1. `setup.ps1` / `setup.sh` — clone 引擎到 `engine/`、uv sync、下載模型、裝前端相依
2. (可選 SFX)`setup-sfx.ps1` / `.sh`,然後**兩步手動授權**:HF 模型頁按「Agree and access repository」+ `engine-sfx/.venv/Scripts/hf.exe auth login`(401=沒登入、403=沒按同意)
3. (可選 MCP)`cd mcp-server && npm install`,`.mcp.json` 會讓 Claude Code 自動載入 `ace-studio` server

## 常用指令

- 前端型別檢查:`cd frontend && npx tsc --noEmit`
- MCP 冒煙測試:`node mcp-server/smoke-test.mjs`(加 `--full` 會真的生成一個 SFX)
- 生成管線(UI 與 MCP 同一條):生成 → helper `/trim-silence` 裁靜音 → `/library/import-audio` 落地 → `/library/add-item` 入庫;前端每 5 秒輪詢 `GET /library` 的 `updatedAt` 自動刷新

## 關鍵事實(踩過的坑)

- **8GB VRAM**:BGM 引擎必須設 `ACESTEP_OFFLOAD_TO_CPU=true` + `ACESTEP_OFFLOAD_DIT_TO_CPU=true`(run-engine 已內建);SFX 引擎預設 `SFX_CPU_OFFLOAD=true`;前端切回 BGM 會自動打 `POST /sfx/release` 還 VRAM
- **引擎 API**:`/query_result` 的 `result` 是 JSON **字串**要再 parse;BGM 最短約 5 秒(短音效靠 SFX 引擎)
- **engine-sfx 相依**:`transformers==4.51.3` 是釘死的(5.x 需 torch 2.7+),別升;`torchsde` 必裝
- **PowerShell 5.1**:`.ps1` 檔案必須 ASCII-only(UTF-8 無 BOM 的中文會被 cp950 誤解析);`.cmd`/`.sh`/前端檔案不受限
- **library/ 是唯一資料源**:`library/library.json` + `library/audio/`,gitignored;增刪一律走 helper 的 `/library/add-item`、`/library/remove-item`(原子),不要直接改檔
- **engine/ 與 engine-sfx/.venv 不進版控**:engine 整個資料夾是第三方 clone

## 慣例

- 文件/UI 文案:繁體中文;程式註解:繁中;commit message:繁中 + conventional prefix
- UI 設計:暖炭底 + 琥珀主色(#E8A24C),避免 generic AI 風;字體 Bricolage Grotesque / Hanken Grotesk / JetBrains Mono
- 規劃用 dual-plan:`plans/<日期-slug>/plan.md`(正本)+ `plan.html`(渲染,gitignored)
