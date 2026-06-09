# ACE-Step 1.5 XL — 文字生成音樂／音效／遊戲 BGM 完整研究與工具包

> 目標：用 ACE-Step 1.5 XL 從「文字」產生**音效 (SFX)** 與**遊戲背景音樂 (BGM)**。
> 本資料夾包含：可行性結論、安裝文件、CLI 腳本、Prompt 撰寫指南、ComfyUI 節點教學、現成 prompt 範例庫。

---

## 0. 一句話結論

ACE-Step 1.5 XL **非常適合做「遊戲背景音樂」**（loop、戰鬥、探索、選單、Boss、勝利等），
也適合做**音樂性音效**（stinger 過場、勝利 jingle、UI 提示音、環境氛圍 ambient）。

它**不是**傳統 Foley 引擎 —— 像「劍碰撞聲」「腳步聲」「爆炸」這種 1 秒以內的離散擬音，
不是它的強項（它本質是「整首歌生成器」）。下方有針對這類需求的變通做法與替代工具建議。

| 需求 | ACE-Step 適合度 | 做法 |
|------|----------------|------|
| 遊戲關卡 / 戰鬥 / 選單 BGM | ⭐⭐⭐⭐⭐ | 直接生成，見 `prompts/game_bgm.md` |
| 可循環 loop 音樂 | ⭐⭐⭐⭐ | 生成後在 DAW 抓 loop 點，或用 repaint 接縫 |
| 過場 / 勝利 / 失敗 stinger（3–8 秒） | ⭐⭐⭐⭐ | 短 duration + 結構標籤，見 `prompts/sfx.md` |
| 環境氛圍 ambient（風、洞窟、太空） | ⭐⭐⭐⭐ | 用 ambient/drone 標籤 + 無人聲 |
| UI 點擊 / 提示音（音樂性） | ⭐⭐⭐ | 短 duration + 單一樂器，需後製裁切 |
| 離散 Foley（腳步、爆炸、刀劍） | ⭐ | 建議改用 Stable Audio / AudioGen / 音效庫 |

---

## 1. ACE-Step 1.5 XL 是什麼

- 開源（MIT license）本地音樂生成模型，2026/01 推出 1.5，2026/04 推出 **XL** 系列。
- XL 用 **4B 參數 DiT decoder**，音質更高；支援 50+ 語言、最長約 10 分鐘。
- 速度極快：turbo 變體只要 **8 步**，RTX 3090 等級可在 10 秒內出一首。
- 三個 XL 變體：
  | 變體 | 步數 | CFG | VRAM | 用途 |
  |------|------|-----|------|------|
  | `acestep-v15-xl-turbo` | 8 | 否 | ≥12GB | **最快、日常首選**（做 BGM 量產） |
  | `acestep-v15-xl-sft`   | 50 | 是 | ≥12GB | 最高品質、細節 |
  | `acestep-v15-xl-base`  | 50 | 是 | ≥12GB | 進階任務（extract / lego / complete 混音重製） |
- 輸入分兩種：
  - **tags**（描述曲風、樂器、情緒、場景、BPM —— 控制信號）
  - **lyrics**（歌詞，支援 `[verse]`/`[chorus]`/`[instrumental]` 結構標籤；做純音樂就填 `[instrumental]`）

---

## 2. 兩條使用路線

你可以擇一，本包兩條都備好：

### 路線 A：官方 Python CLI（適合批次量產、寫腳本自動化）
- 安裝見 [`INSTALL.md`](INSTALL.md)
- 用 [`scripts/generate.py`](scripts/generate.py) 一行指令出音樂
- 用 [`scripts/batch_game_bgm.py`](scripts/batch_game_bgm.py) 一次跑完整套遊戲配樂

### 路線 B：ComfyUI（適合視覺化、邊調邊聽、接其他工作流）
- 節點逐一教學見 [`COMFYUI-GUIDE.md`](COMFYUI-GUIDE.md)
- 現成 workflow JSON 在 [`comfyui/`](comfyui/) 資料夾

---

## 3. 檔案總覽

```
ACE-step/
├── README.md                ← 你在這
├── INSTALL.md               ← 安裝（Windows / CUDA）
├── PROMPT-GUIDE.md          ← Prompt 撰寫完整指南（核心）
├── WEB-UI-GUIDE.md          ← 原生 Web UI 每個專有名詞的白話說明（含 4060 8GB 建議設定）
├── FRONTEND-SPEC.md         ← 自製前端設計需求書（餵 Pencil 生稿用；DAW 深色風）
├── IMPLEMENTATION-SPEC.md   ← 前端實作技術規格（含已確認的 acestep-api 端點、選型、里程碑）
├── COMFYUI-GUIDE.md         ← ComfyUI 每個節點的用途與串接教學
├── scripts/
│   ├── generate.py          ← 單首生成 CLI
│   ├── batch_game_bgm.py    ← 批次生成整套遊戲 BGM
│   └── presets.json         ← 遊戲場景 → prompt 預設對照表
├── prompts/
│   ├── game_bgm.md          ← 遊戲各場景 BGM prompt 範例庫
│   ├── sfx.md               ← 音效 / stinger / ambient prompt 範例庫
│   └── cheatsheet.md        ← 標籤速查表（曲風/情緒/樂器/BPM）
└── comfyui/
    └── README.md            ← workflow 載入說明
```

---

## 4. 快速開始（3 步）

```powershell
# 1. 安裝（詳見 INSTALL.md）
uv run acestep-download --model acestep-v15-xl-turbo

# 2. 生成一首戰鬥 BGM
python scripts/generate.py `
  --tags "epic orchestral battle, fast tempo, war drums, brass, strings, intense, 140 BPM" `
  --instrumental --duration 60 --out battle_theme.wav

# 3. 一次跑整套遊戲配樂
python scripts/batch_game_bgm.py
```

---

## 5. 來源

- [ACE-Step 1.5 官方 repo](https://github.com/ace-step/ACE-Step-1.5)
- [官方完整教學 Tutorial.md](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md)
- [ACE-Step ComfyUI repo](https://github.com/ace-step/ACE-Step-ComfyUI)
- [ComfyUI 官方 ACE-Step 範例](https://docs.comfy.org/tutorials/audio/ace-step/ace-step-v1)
- [ComfyUI Wiki ACE-Step 教學](https://comfyui-wiki.com/en/tutorial/advanced/audio/ace-step/ace-step-v1)
- [ACE-Step 1.5 XL Turbo ComfyUI workflow](https://comfy.org/workflows/audio_ace_step1_5_xl_turbo-9851c174a194/)
- [Ambience AI Prompt 指南](https://www.ambienceai.com/tutorials/ace-step-music-prompting-guide)
- [ACE-Step 1.5 完整 2026 指南 (DEV)](https://dev.to/czmilo/ace-step-15-the-complete-2026-guide-to-open-source-ai-music-generation-522e)
