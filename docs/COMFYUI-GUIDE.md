# ComfyUI × ACE-Step 1.5 XL — 節點串接逐一教學

> 目標：在 ComfyUI 裡用文字產生遊戲 BGM / 音效。
> 本文逐一講解每個節點的用途、輸入輸出、怎麼連、建議參數。

---

## 0. 先看整體資料流（文字 → 音樂）

```
[Load Checkpoint] ──MODEL──┐
        │                  ├──► [KSampler] ──LATENT──► [VAEDecode/內建] ──► [SaveAudio]
        │                  │          ▲
        ├──CLIP/條件器──► [TextEncodeAceStepAudio] ──(positive)──┘
        │                  └► [TextEncodeAceStepAudio] ──(negative，可空)
        │
[EmptyAceStepLatentAudio] ──LATENT(空白/決定長度)──► [KSampler]
                                                          │
                          [LatentOperationTonemapReinhard]┘(選用，控人聲大小)
```

> ACE-Step 的音訊「latent」是時間軸上的潛在表示；`EmptyAceStepLatentAudio` 決定**秒數**，
> `KSampler` 把噪音逐步去噪成音樂 latent，最後解碼成波形存成音檔。

---

## 1. 各節點詳解

### ① Load Checkpoint（`CheckpointLoaderSimple`）
- **用途**：載入 ACE-Step 模型權重。
- **設定**：`ckpt_name` 選 `ace_step_v1_3.5b.safetensors`（或 XL 對應權重）。
- **輸出**：`MODEL`、`CLIP`(條件編碼器)、`VAE`(解碼器)。
- **檔案放**：`ComfyUI/models/checkpoints/`。
- > XL 若拆成多檔（diffusion model + VAE + text encoder），改用對應的
  >   `UNETLoader` / `VAELoader` / `CLIPLoader` 分開載，節點會提示缺檔。

### ② EmptyAceStepLatentAudio
- **用途**：建立一段「空白音訊 latent」，**這裡決定音樂長度**。
- **關鍵參數**：
  - `seconds`：BGM 設 30–120；stinger 設 3–8。
  - `batch_size`：一次出幾個版本（量產設 2–4 挑最好的）。
- **輸出**：`LATENT` → 接到 KSampler 的 `latent_image`。

### ③ TextEncodeAceStepAudio（正向，positive）
- **用途**：把你的 **tags + lyrics** 編碼成模型聽得懂的條件向量。**這是 prompt 主入口**。
- **輸入**：`CLIP`（來自 Load Checkpoint）。
- **欄位**：
  - `tags`：曲風/樂器/情緒/BPM，例：`epic orchestral battle, war drums, brass, 140 BPM, instrumental`
  - `lyrics`：歌詞或結構標籤；純音樂填 `[instrumental]`
  - `lyrics_strength`（若有）：歌詞影響力，純音樂可調低或預設。
- **輸出**：`CONDITIONING` → 接 KSampler 的 `positive`。

### ④ TextEncodeAceStepAudio（負向，negative）— 選用
- **用途**：描述「**不要**什麼」。純音樂可在這放 `vocals, voice, singing` 來壓人聲。
- 也可整個留空 / 用一個空的 conditioning。
- **輸出**：→ KSampler 的 `negative`。

### ⑤ ACE-Step Lyrics Language Switch（選用，預設 bypass）
- **用途**：把多語言歌詞轉成英文字符以利對齊。做純音樂用不到，**保持 bypass**。

### ⑥ KSampler（核心：去噪取樣）
- **用途**：實際「生成」步驟，把空白 latent 依條件去噪成音樂。
- **輸入**：`model`、`positive`、`negative`、`latent_image`。
- **建議參數**：
  | 參數 | turbo | sft/base |
  |------|-------|----------|
  | `steps` | 8 | 32–50 |
  | `cfg` | 1.0（turbo 不吃 CFG） | 3–7 |
  | `sampler_name` | `euler` / `dpmpp_2m` | 同 |
  | `scheduler` | `simple` / `normal` | 同 |
  | `denoise` | 1.0（純文字生成） | 1.0 |
  | `seed` | 固定整數可重現 | 同 |
- **輸出**：`LATENT` → VAE 解碼 / SaveAudio。

### ⑦ LatentOperationTonemapReinhard（選用：控人聲突出度）
- **用途**：對 latent 做色調映射，`multiplier` 越大→人聲越突出；做純 BGM 想壓人聲就調小或不接。
- **接法**：插在 KSampler 輸出與解碼之間（透過 `LatentApplyOperation` 類節點套用）。

### ⑧ VAE Decode（音訊版，常已內建在 SaveAudio 流程）
- **用途**：把音樂 latent 解碼成實際波形。XL workflow 多半用對應的 audio VAE。

### ⑨ SaveAudio（`SaveAudioMP3` / `SaveAudio`）
- **用途**：輸出音檔。
- **設定**：`filename_prefix`（例 `game_bgm/battle`）、格式 MP3/WAV/FLAC。
- **輸出位置**：`ComfyUI/output/audio/`。

### ⑩ Show Text（選用）
- 顯示生成資訊 / LLM 規劃出的最終 prompt，方便除錯。

---

## 2. 最小可用連線清單（純文字生成 BGM）

1. `Load Checkpoint` → MODEL/CLIP/VAE
2. `EmptyAceStepLatentAudio`（seconds=60）→ LATENT
3. `TextEncodeAceStepAudio`(positive)：CLIP 來自①，填 tags + `[instrumental]`
4. `TextEncodeAceStepAudio`(negative)：填 `vocals, voice`（或留空）
5. `KSampler`：model←①、positive←③、negative←④、latent←②，steps=8、cfg=1（turbo）
6. `VAE Decode`（VAE←①，samples←⑤）
7. `SaveAudio`：filename_prefix=`game_bgm/battle`

---

## 3. 進階 workflow（用得到自訂節點時）

ACE-Step-ComfyUI 自訂節點額外提供：
- **LLM 規劃節點**：你只給一句中文/英文描述（如「黑暗的 Boss 戰音樂」），由內建語言模型
  幫你展開成完整 tags + 結構，再餵給 TextEncodeAceStepAudio。對應 CLI 的 `thinking` / LM。
- **Cover / Repaint 節點**：載入一段參考音訊 → 設 `audio_cover_strength`(0–1) → 局部重繪。
  做 **loop 無縫接縫**就用 repaint 重畫頭尾。
- **Extract / Lego / Complete**（base 模型）：抽軌、加層、補伴奏。

---

## 4. 載入本包 workflow

把 `comfyui/` 內的 `*.json` 直接拖進 ComfyUI 視窗即可載入。
若節點顯示紅色缺失 → 代表自訂節點或模型檔沒裝，照 `INSTALL.md` 補。
官方範本路徑：ComfyUI 選單 → **Workflow → Browse Templates → Audio → ACE-Step 1.5 XL (Turbo / Base)**。

---

## 5. 量產遊戲配樂的 ComfyUI 流程建議
1. 用 turbo（8 步）+ `batch_size=4` 快速出 4 個版本試 prompt。
2. 固定 `seed`、改 tags 做 A/B 比較。
3. 選定後把 `EmptyAceStepLatentAudio.seconds` 拉長、改 `acestep-v15-xl-sft` 出定稿。
4. `SaveAudio` 用 `filename_prefix=scene_name`，輸出後在 DAW 抓 loop 點。
