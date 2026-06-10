# 實作技術規格 — ACE Studio 前端

> 把設計稿 (`frontend.pen` / `FRONTEND-SPEC.md`) 變成可跑的程式的開發契約。
> 後端端點是**實際從 `D:\AI\ACE-Step-1.5\acestep\api` 原始碼確認**過的，不是猜的。

---

## 1. 架構總覽

```
┌────────────────────────┐     HTTP/JSON      ┌──────────────────────────┐
│  前端 (React+Vite+TS)   │ ◀────────────────▶ │  acestep-api (FastAPI)    │
│  ACE Studio UI         │   /v1/init          │  127.0.0.1:8001          │
│  - 單首/批次/定時/模板   │   /release_task     │  in-memory queue(workers=1)│
│  - 音檔庫 + 波形播放器   │   /query_result(輪詢)│  → ACE-Step DiT + 5Hz LM  │
│  - AI 助手聊天          │   /v1/audio         └──────────────────────────┘
└─────────┬──────────────┘
          │ /chat (tool-use)
          ▼
┌────────────────────────┐     ┌──────────────────────────┐
│  Claude 代理 (Node/FastAPI)│ ▶ │  Anthropic API            │
│  持有 ANTHROPIC_API_KEY  │     │  claude-sonnet-4-6 / opus │
└────────────────────────┘     └──────────────────────────┘
          │
          ▼
   本機音檔庫 sidecar (library.json + 各音檔 .json)  ← 第 7 節
```

- 前端只跟兩個後端講話：**acestep-api**（生成）與 **Claude 代理**（聊天規劃）。
- Claude API key 絕不放前端，走一個薄代理。

---

## 2. 技術選型

| 項目 | 選擇 | 理由 |
|------|------|------|
| 框架 | **React 18 + Vite + TypeScript** | 快、生態大、好對接設計稿 |
| 樣式 | **Tailwind CSS**（用 `FRONTEND-SPEC.md` 第2節 token 設成 CSS 變數/theme） | DAW 深色配色一致 |
| 狀態 | **Zustand** | 輕量，適合這種多面板共享狀態 |
| 波形 | **wavesurfer.js** | 現成波形 + 播放游標 |
| 資料抓取 | **TanStack Query**（輪詢 query_result 很合用） | 內建 polling/retry/cache |
| 圖示 | **lucide-react** | 與設計稿同一套 icon |
| 路由 | 單頁 + 分頁狀態即可（不需 router），設定為 modal | 對應設計稿 |

---

## 3. 後端 API（acestep-api，已確認）

啟動：
```powershell
cd D:\AI\ACE-Step-1.5
# 不設 api key（本機開發最簡單，避免 <audio> 取檔的授權問題，見 §6）
uv run acestep-api --host 127.0.0.1 --port 8001
# 需要鑰匙時：--api-key <KEY>（或環境變數 ACESTEP_API_KEY）
```
預設 `127.0.0.1:8001`。**workers=1、佇列在記憶體** → 一次只跑一個 job，佇列滿回 `429`。

| 方法 | 路徑 | 用途 | 重點 |
|------|------|------|------|
| GET | `/health` | 健康檢查 | |
| GET | `/v1/stats` | GPU/狀態 | 給狀態列用 |
| GET | `/v1/models` | 可用模型清單 | 填模型下拉 |
| GET | `/v1/model_inventory` | 模型/LM 清單細節 | 設定頁 |
| POST | `/v1/init` | **初始化服務（載入模型）** | body=InitModelRequest |
| POST | `/v1/reinitialize` | 換模型重載 | |
| POST | `/release_task` | **送出生成 job** | body=GenerateMusicRequest → 回 `{task_id,status,queue_position}` |
| POST | `/query_result` | **輪詢結果** | body=`{task_id_list:"[\"<id>\"]"}`（注意是 JSON 字串） |
| GET | `/v1/audio?path=<raw_path>` | **取音檔** | 回 FileResponse |
| POST | `/v1/create_sample` `/format_input` | LM 輔助產 prompt/格式化 | 選用 |
| POST | `/v1/lora/*` | LoRA 載入/卸載/縮放 | 進階，先不接 |

**授權**：帶 `Authorization: <key>` header，或 body 放 `ai_token`。本機開發不設 key 最省事。
**回應外層**：各端點以 `wrap_response(data, code, error)` 包裝（讀 `data`）。

### InitModelRequest（POST /v1/init）
```jsonc
{ "model": "acestep-v15-xl-turbo", "init_llm": false, "lm_model_path": "acestep-5Hz-lm-1.7B" }
```

### GenerateMusicRequest（POST /release_task）— 關鍵欄位
```jsonc
{
  "prompt": "epic orchestral battle, war drums, 140 BPM, instrumental", // ← 這是 caption/tags
  "lyrics": "[Instrumental]",
  "model": "acestep-v15-xl-turbo",
  "audio_duration": 60,            // ← 長度（秒）
  "inference_steps": 8,
  "guidance_scale": 7.0,
  "infer_method": "ode",           // ode | sde
  "bpm": null,                     // null=自動
  "key_scale": "",                 // 空=自動
  "use_random_seed": true,
  "seed": -1,                      // use_random_seed=false 時用這個固定種子
  "audio_format": "wav",           // wav | mp3 | flac | ...
  "task_type": "text2music",       // text2music | cover | repaint | ...
  "thinking": false,               // 是否用 5Hz LM 思考展開
  "batch_size": 1
}
```

### query_result 回應（每個 task 一筆）
```jsonc
{
  "status": "...",                 // 對應 store 狀態（queued/running/done/error）
  "first_audio_path": "/v1/audio?path=...",   // ← 可直接當音檔 URL
  "audio_paths": ["/v1/audio?path=..."],
  "raw_audio_paths": ["D:\\...\\xxx.wav"],     // 本機真實路徑（「打開本地目錄」用）
  "seed_value": "12345",
  "prompt": "...", "lyrics": "...",
  "metas": { "bpm": 140, "duration": 60, "keyscale": "...", "genres": "..." },
  "generation_info": "...", "status_message": "..."
}
```

---

## 4. 核心生成流程

```
1. 開 app → GET /health & /v1/stats → 顯示服務狀態燈
2. 使用者按「初始化服務」→ POST /v1/init {model, init_llm} → 等成功
3. 填表（或 AI 助手填）→ 按「生成音樂」
   → POST /release_task {prompt, lyrics, audio_duration, ...} → 拿 task_id
   → UI 進入「生成中」狀態（§ 狀態變體①）
4. 每 1~2 秒 POST /query_result {task_id_list:"[task_id]"} 輪詢
   → status=done：取 first_audio_path 載入播放器、raw_audio_paths 存 sidecar
   → status=error：顯示錯誤 toast（OOM 提示開 Offload/縮長度）
5. 寫入音檔庫 sidecar（§7），右側列表更新
```
> 因 workers=1，**批次生成要在前端序列化**（一個完成才送下一個），佇列滿 429 就等。

---

## 5. UI 欄位 → API 欄位對應（重要，別接錯）

| 前端 UI | GenerateMusicRequest 欄位 |
|---------|---------------------------|
| 曲風描述 caption（= 基底+額外合成後） | `prompt` |
| 歌詞 / 純音樂 | `lyrics`（純音樂填 `[Instrumental]`） |
| 長度滑桿 | `audio_duration` |
| 模型下拉 | `model` |
| 步數 | `inference_steps` |
| CFG | `guidance_scale` |
| 取樣方式 | `infer_method` |
| BPM / 調性 | `bpm` / `key_scale` |
| 種子（鎖定） | `use_random_seed=false` + `seed` |
| 輸出格式 | `audio_format` |
| AI 助手 thinking | `thinking` |

---

## 6. ⚠️ 兩個一定要處理的雷

1. **`<audio>`/波形取檔的授權**：`GET /v1/audio` 受 api key 保護，但 `<audio src>` 無法帶 header。解法擇一：
   - **本機開發**：啟動 acestep-api 時**不設 api key** → 直接用 URL。
   - **有 key 時**：用 `fetch(url,{headers})` 取 blob → `URL.createObjectURL` 再餵播放器；或用 Vite dev proxy 注入 Authorization。
2. **CORS**：前端(5173)跨到 8001。用 **Vite dev proxy**（`/api` → `http://127.0.0.1:8001`）最乾淨，順便解上面授權問題。

---

## 7. Prompt 合成 + 音檔庫記錄（落實 FRONTEND-SPEC §9、§10）

合成：`prompt = base + (", " + extra 若有)`。送出前在前端組好字串。

每次生成完成寫一筆 sidecar（建議集中式 `library.json`，或與音檔同名 `.json`）：
```jsonc
{
  "id": "uuid",
  "file": "D:\\...\\stealth_tense_01.wav",
  "final_caption": "dark ambient, low drone, tense, 80 BPM, instrumental, lots of reverb",
  "base": "dark ambient, low drone, tense, 80 BPM, instrumental",
  "extra": "lots of reverb",
  "lyrics": "[Instrumental]",
  "params": { "model":"acestep-v15-xl-turbo","audio_duration":60,"inference_steps":8,
              "guidance_scale":7,"seed":12345,"infer_method":"ode","audio_format":"wav" },
  "template_id": null, "scene": "stealth_tension",
  "created_at": "2026-06-09T12:00:00Z"
}
```
- **複製 prompt** → 複製 `final_caption`（或含 params 的完整描述）。
- **打開本地目錄** → 用 `raw_audio_paths` / `file`：Windows `explorer /select,<path>`（需經本機代理執行，瀏覽器不能直接開檔總管）。
- **重新生成** → 讀回 base/extra/params，`use_random_seed=true` 換新 seed。
- **存為模板** → 把 base + 預設 params 寫成模板。

> sidecar 與「打開本地目錄」都需要一支**本機小代理**（讀寫檔、開檔總管）；可與 Claude 代理合併成同一個 Node/FastAPI 服務。

---

## 8. Claude 助手整合（tool-use）

- **薄代理**（Node/Express 或 FastAPI）持有 `ANTHROPIC_API_KEY`，暴露 `POST /chat`（可串流）。
- 模型：預設 `claude-sonnet-4-6`（成本/品質均衡）；要更強規劃用 `claude-opus-4-8`。
- **工具定義**（Claude 回傳 tool_use，前端執行）：
  | 工具 | 作用 |
  |------|------|
  | `fill_single_form` | 填單首表單：{caption, lyrics, duration, model...} |
  | `set_params` | 調整進階參數 |
  | `queue_batch` | 排批次：{scenes[], extra, count} |
  | `save_template` | 存模板：{name, base, params} |
  | `list_presets` | 讓 Claude 知道有哪些場景/模板可用 |
- 流程：使用者訊息 → 代理呼叫 Claude（附工具與目前狀態 context）→ Claude 回文字+tool_use → 前端把 tool_use 轉成動作卡（「套用並生成 / 全部排入批次」）等使用者確認再執行。
- 與 ACE-Step 5Hz LM 分工：Claude=對話/規劃/寫prompt；5Hz LM=模型內部展開。
- 細節（tool 格式、串流、token）實作時對照 `claude-api` 指南。

---

## 9. 設計稿 → 元件對應

| 設計稿區塊 | React 元件 |
|------------|-----------|
| Top Bar | `<TopBar>`（ModelSelect, StatusDot, InitButton, SettingsButton） |
| 左欄場景/模板 | `<PresetSidebar>`（`<PresetCard>` × N，內建+使用者兩組） |
| 中央分頁 | `<CenterTabs>` → `<SingleGen>` `<BatchGen>` `<Schedule>` `<Templates>` |
| 進階參數 | `<AdvancedParams>`（折疊） |
| 右欄 | `<RightPanel>` → tab `<AssistantChat>` / `<Library>` |
| 底部播放列 | `<TransportBar>`（wavesurfer + 打開目錄/複製prompt） |
| 設定 modal | `<SettingsModal>` |
| 狀態 | toast、進度、空狀態元件（對應狀態變體板 5 種） |

---

## 10. 狀態管理（Zustand stores）

- `serviceStore`：模型、初始化狀態、GPU stats。
- `genStore`：目前單首表單（base/extra/lyrics/params）、生成中進度、目前曲目。
- `batchStore`：勾選場景、extra、佇列（序列化執行）。
- `libraryStore`：音檔清單（來自 sidecar）、篩選/搜尋。
- `templateStore` / `scheduleStore`：模板、排程設定。
- `chatStore`：對話訊息、待確認的動作卡。

---

## 11. 專案結構（建議）

```
ace-studio/
├── index.html
├── vite.config.ts          # dev proxy: /api → 8001, /chat → 代理
├── src/
│   ├── api/                # acestepClient.ts（init/release/query/audio）、claudeClient.ts
│   ├── stores/             # zustand stores
│   ├── components/         # TopBar, PresetSidebar, CenterTabs, ...
│   ├── lib/                # promptCompose.ts, library(sidecar), format
│   └── theme.css           # 設計稿 token
└── server/                 # 本機代理：Claude /chat + 開檔總管 + sidecar 讀寫
```

---

## 12. 里程碑（建議順序）

1. **M1 — 走通單首**：dev proxy + 啟動 acestep-api(無 key) → init → 單首生成表單 → release/poll → 播放器播放 + 寫 sidecar + 音檔庫列表。（最小可用）✅
2. **M2 — 場景/模板 + 統一佇列**：左欄範本一鍵帶入；統一生成佇列（右側抽屜）；模板管理；自動裁切；一鍵啟動。✅
3. **M3 — 音檔庫落地 + 設定 modal**：library.json + library/audio/ 落地磁碟（脫離引擎暫存）；設定頁調進階參數。✅（端點見 §16）
4. **M4 — SFX 引擎（雙引擎）**：預設 Stable Audio Open 做 0.5–2 秒離散音效；前端加 BGM/SFX 類型切換。見 [SFX-ENGINE.md](SFX-ENGINE.md)。*（2026-06-10 與使用者確認：SFX 提前，原 M6 → M4）*
5. **M5 — AI 助手**：Claude 代理 + tool-use 動作卡。（待定）
6. **M6 — 定時排程**：見 §13。（待定）

---

## 13. 待確認 / 風險

- **定時排程**：acestep-api **沒有 cron**。瀏覽器內計時只在開著 app 時有效。要真正「定時」需在本機代理放一個排程器（node-cron）持續跑。先在 UI 標明「需 app/代理保持開啟」。
- **單併發**：workers=1，批次/多人要排隊；UI 要明確顯示佇列。
- **wrap_response 外層欄位名**：實作時先打一次 `/v1/models` 確認 `{code,data,error}` 實際鍵名再寫 client。
- **query_result status 字串對應**：實際字面值（queued/running/succeed/failed…）以打一次為準，對照 `acestep/api/jobs/store.py` 的狀態。
- **/release_task 內容型別**：支援 JSON 與 multipart（上傳參考音檔時用 multipart）。text2music 用 JSON 即可。
- **長度上限**：8GB + turbo 實測可生成的最長秒數需驗證（OOM 時回 error，UI 已有提示）。
- **長度下限**：ACE-Step `DURATION_MIN=10`（no-LM 實測 ~5s）→ **做不出 <5s 音效**。BGM 長度滑桿最小 5s；短音效走 SFX 引擎或裁切。

---

## 14. 雙引擎（BGM + SFX）

ACE Studio 設計成**引擎可插拔**：前端依「類型」把請求路由到不同後端，皆包成統一 `/generate` 合約。
- **BGM** → `engine/`（ACE-Step，本規格主體）。
- **SFX** → `engine-sfx/`（預設 **Stable Audio Open**：音質佳、<$1M 商用免費但需掛「Powered by Stability AI」；備案 **AudioGen** MIT 零條件）。做 0.5–2 秒離散音效。

完整選型比較、授權、AudioGen wrapper、8GB 載入策略、SFX prompt 風格見 **[SFX-ENGINE.md](SFX-ENGINE.md)**。

**對 M1 的影響**：`server/` 的 adapter 一開始就用統一 `/generate` 合約（即使只有 BGM 一個後端），之後加 SFX 只是多註冊一個後端，不用重構。

---

## 15. 實測校正（M1 端到端驗證，2026-06-10）

實機啟動引擎打過 API，修正了規格中幾處與實際不符、並發現 8GB 關鍵設定：

### 15.1 `/query_result` 真實回應（與 §3 早期假設不同）
`data` 是陣列，每筆 `{task_id, status, result, progress_text}`，其中 **`result` 是 JSON 字串**，parse 後取 `[0]`：
```jsonc
{
  "file": "/v1/audio?path=<urlencoded 絕對路徑>",   // ← 已是可播放 URL，前綴 /api 即可
  "wave": "",
  "status": 1,                 // 0=running, 1=succeeded
  "progress": 1.0,             // 0..1，可直接驅動進度條
  "stage": "succeeded",        // running / Generating music... / Decoding audio... / succeeded
  "seed_value": "2268102829",
  "metas": { "bpm":140, "duration":10.0, "keyscale":"G minor", ... },
  "dit_model": "acestep-v15-turbo", "lm_model": "acestep-5Hz-lm-0.6B",
  "generation_info": "Total generation time: 5.25s ..."
}
```
- 完成判定：`status===1` 或 `progress>=1` 或 `stage==='succeeded'`。
- 播放 URL = `/api` + `file`；原始路徑 = `decodeURIComponent(file.split('path=')[1])`。
- 前端 `acestepClient.parseResult()` 已照此實作。

### 15.2 ⚠️ 8GB 顯存：必須開 DiT offload，否則卡死
- DiT 留在顯存時，VAE 解碼前「effective free VRAM ≈ 0.06GB」→ 引擎自動 **CPU VAE decode → 卡死**（實測 XL 與 2B 皆然）。
- 修法：啟動引擎設 **`ACESTEP_OFFLOAD_DIT_TO_CPU=true`**（+ `ACESTEP_OFFLOAD_TO_CPU=true`），DiT 在解碼時退出顯存 → GPU VAE 解碼。**已寫進 `run-engine.ps1/.sh`。**
- 注意 `/v1/init` API **不接受 offload 參數**（InitModelRequest 只有 model/slot/init_llm/lm_model_path），offload 只能靠**啟動環境變數**。

### 15.3 8GB 預設模型 = 2B turbo（非 XL）
- XL(4B) 在 8GB 會吃滿顯存（allocated ~11GB，spill 到 shared RAM）。**預設改用 `acestep-v15-turbo`(2B)**，實測 10s 約 5.25s 完成。XL/xl-sft 留給 ≥12GB。前端預設已改 2B。

### 15.4 其他確認
- 回應外層 envelope = `{data, code, error, timestamp, extra}`（`unwrap()` 取 `data`，正確）。
- `/v1/models` 為 OpenAI 風 `{object:"list", data:[]}`，**初始化前為空** → 前端改用內建已知清單填下拉。
- `/release_task` 回 `{task_id, status:"queued", queue_position}`。
- 啟動不會自動載模型（`models_initialized:false`）→ 仍需呼叫 `/v1/init`。
- `thinking:false` 時引擎仍會跑一個小 LM(0.6B) 產生 metadata(bpm/key)，約 1.7s，正常。

---

## 16. 本機小幫手 API（`server/index.mjs`，:8787，M3 實作）

零相依純 Node。所有需要碰本機檔案系統的操作都走這支（瀏覽器做不到的部分）。

| 方法 | 路徑 | Body / 參數 | 回應 | 用途 |
|---|---|---|---|---|
| GET | `/health` | — | `{ok, service}` | 偵測 run-local 是否啟動 |
| POST | `/open-folder` | `{path}`（檔案或資料夾） | `{ok}` | 檔案總管開啟（檔案→`/select`、資料夾→直接開） |
| POST | `/trim-silence` | `{path, thresh?}` | `{ok, out}` | 裁頭尾靜音 → `_loop.wav`（thresh 由設定頁調，預設 0.006） |
| GET | `/library` | — | `{ok, items, dir}` | 讀 `library/library.json` |
| POST | `/library` | `{items: LibraryItem[]}` | `{ok}` | 整份覆寫 library.json |
| POST | `/library/import-audio` | `{path, id}` | `{ok, path, url}` | 複製音檔 → `library/audio/<id><ext>`（脫離引擎 tmp） |
| POST | `/library/delete-audio` | `{filename}` | `{ok}` | 刪 `library/audio/` 內檔案（檔名白名單防 traversal） |
| GET | `/audio/<file>` | — | 音檔串流 | 播放落地音檔（支援 Range/206；HEAD 不支援） |

### 落地流程（M3 後的生成管線）
1. 生成完成 →（可選）`/trim-silence` 產生 `_loop.wav`
2. `/library/import-audio` 把最終檔複製進 `library/audio/<itemId>.wav`，播放 URL 換成 `http://127.0.0.1:8787/audio/...`
3. `libraryStore` 每次增刪整份 POST `/library` 覆寫 library.json
4. 前端啟動時 `hydrate()`：磁碟有資料→以磁碟為準；磁碟空而 localStorage 有舊作品→**自動遷移**（複製音檔 + 寫 library.json）
5. run-local 沒開 → 自動退回 localStorage 模式（行為同 M2）

### 設定 modal（TopBar 齒輪）
- 進階生成參數：steps / guidance / 取樣方法(ode/sde) / 輸出格式 / 種子 — 存 `genStore`（localStorage persist，深合併防舊值蓋新預設）
- 自動裁切閾值 `trimThresh`（0.001–0.02）
- 資料儲存狀態：顯示落地模式 + library 路徑 + 開資料夾按鈕
