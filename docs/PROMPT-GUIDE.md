# ACE-Step Prompt 撰寫完整指南（音效 + 遊戲 BGM 取向）

> 核心觀念：ACE-Step 的 **tags 是「控制信號」不是「文案」**。
> 它對乾淨、機械式、逗號分隔的關鍵字反應最好，對華麗的句子反應差。
> 「sad piano ballad with female breathy vocal」遠勝「一首很憂傷的歌」。

---

## 1. 黃金公式

```
[曲風/年代] , [關鍵樂器] , [情緒/形容詞] , [BPM/節奏] , [製作/場景]
```
- **3–7 個標籤**最佳，不要堆疊超過 7 個。
- 只用**一個主曲風**，其餘是補強。
- 逗號分隔，每段簡短。

### 標準範例（拆解）
```
indie folk, acoustic guitar, piano, soft strings, warm, nostalgic, 95 BPM
```
| 部位 | 內容 |
|------|------|
| 曲風 | indie folk |
| 樂器 | acoustic guitar, piano, soft strings |
| 情緒 | warm, nostalgic |
| 速度 | 95 BPM |

---

## 2. 兩個欄位的分工

| 欄位 | 放什麼 |
|------|--------|
| **tags** | 曲風、樂器、情緒、BPM、場景、製作風格（控制「聽起來像什麼」） |
| **lyrics** | 歌詞 + 結構標籤。**做純音樂 / BGM / 音效 → 填 `[instrumental]` 或 `[inst]`** |

### 純音樂（遊戲 BGM 最常用）
- tags：照公式寫
- lyrics：只放 `[instrumental]`
- tags 裡再加一個 `instrumental` 或 `no vocals` 雙保險，避免冒出人聲。

---

## 3. 標籤分類速查（更完整見 `prompts/cheatsheet.md`）

- **曲風**：pop, rock, electronic, hip-hop, jazz, classical, metal, lo-fi, synthwave, ambient, folk, R&B, country, orchestral, cinematic, chiptune, 8-bit
- **情緒**：happy, sad, energetic, chill, dark, epic, romantic, tense, mysterious, heroic, eerie, playful, melancholic, triumphant
- **樂器**：piano, guitar, electric guitar, drums, war drums, bass, synth, strings, violin, brass, choir, flute, harp, bells, arpeggio, pad
- **人聲**：male vocal, female vocal, choir, **no vocals**, humming
- **製作/場景**：8-bit, chiptune, vinyl crackle, reverb-heavy, wide stereo, cinematic, ambient drone, retro game
- **能量結構標籤（放 lyrics）**：`[Intro - ambient]` `[build up]` `[high energy]` `[Climax - powerful]` `[Outro - fade out]`

---

## 4. 結構標籤（放 lyrics 欄）

純音樂也能用結構標籤來「編曲鋪陳」：
```
[Intro - ambient]
[Main Theme - piano]
[Build Up]
[Climax - powerful]
[Outro - fade out]
```
- `[instrumental]` = 純樂器段
- `[Guitar Solo - expressive]`、`[Bridge - whispered]` 控制段落表情

---

## 5. 七大關鍵參數（CLI / ComfyUI 都有對應）

| 參數 | 建議值 | 作用 |
|------|--------|------|
| `inference_steps` | turbo=8；sft/base=32–50 | 擴散步數，多=細但慢 |
| `guidance_scale` / CFG | sft/base 才有，~3–7 | 對 prompt 的服從度 |
| `shift` | 1.0 | timestep 偏移，影響風格 |
| `infer_method` | `ode`(穩定可重現) / `sde`(隨機多樣) | 取樣方式 |
| `duration` | BGM 30–120 秒；stinger 3–8 秒 | 長度 |
| `bpm` | 30–300 | 節奏（也可寫進 tags） |
| `seed` | 固定整數 | 可重現 / 微調用 |

> 量產建議：先用 turbo + `ode` + 固定 seed 快速試 prompt（30 秒），定稿再換 sft 拉長。

---

## 6. 遊戲 BGM 配方（精華）

> 完整範例庫見 [`prompts/game_bgm.md`](prompts/game_bgm.md)

| 場景 | tags | duration |
|------|------|----------|
| 主選單 | `ambient, cinematic, soft synth pad, gentle piano, calm, hopeful, 70 BPM, instrumental` | 60 |
| 探索/平原 | `orchestral adventure, strings, flute, light percussion, uplifting, wonder, 100 BPM, instrumental` | 90 |
| 戰鬥 | `epic orchestral battle, war drums, brass, fast strings, intense, heroic, 140 BPM, instrumental` | 60 |
| Boss 戰 | `dark epic orchestral, choir, heavy drums, dissonant brass, ominous, powerful, 150 BPM, instrumental` | 75 |
| 潛行/緊張 | `dark ambient, low drone, sparse percussion, tense, eerie, 80 BPM, instrumental` | 60 |
| 小鎮/和平 | `folk, acoustic guitar, accordion, warm, cozy, playful, 110 BPM, instrumental` | 60 |
| 勝利 | `triumphant orchestral fanfare, brass, timpani, choir, victorious, 120 BPM, instrumental` | 10 |
| 復古/像素遊戲 | `chiptune, 8-bit, energetic, arpeggio, retro game, 150 BPM, instrumental` | 45 |

**做可循環 loop 的訣竅**：
- duration 設稍長（如 70 秒），生成後在 DAW（Audacity/Reaper）裡找小節邊界裁出乾淨 loop。
- 或用 ACE-Step base 的 repaint，把開頭與結尾接縫處重繪成無縫。
- BPM 固定有助於對齊節拍（例如 120 BPM、4/4，每 8 小節 = 16 秒）。

---

## 7. 音效 / Stinger / Ambient 配方

> 完整見 [`prompts/sfx.md`](prompts/sfx.md)。注意：ACE-Step 做的是「音樂性音效」。

| 類型 | tags | duration | 備註 |
|------|------|----------|------|
| 過場 stinger | `cinematic transition, swell, brass hit, riser, dramatic, instrumental` | 4 | 生成後裁切 |
| 勝利 jingle | `triumphant fanfare, bright brass, bells, short, instrumental` | 6 | |
| 失敗 jingle | `descending sad piano, somber, short, instrumental` | 5 | |
| UI 提示音（音樂性） | `single bright synth chime, bell, clean, instrumental` | 3 | 後製裁到 <1 秒 |
| 升級/獲得 | `magical sparkle arpeggio, harp, bells, uplifting, instrumental` | 4 | |
| 洞窟氛圍 | `dark ambient drone, cave, reverb, eerie, no melody, instrumental` | 60 | 可長放 |
| 太空氛圍 | `space ambient, ethereal pad, cosmic, slow, instrumental` | 90 | |
| 森林氛圍 | `peaceful ambient, soft pad, gentle bells, nature, calm, instrumental` | 60 | |

**離散 Foley（腳步/爆炸/刀劍）建議**：ACE-Step 不擅長。改用
[Stable Audio Open]、[AudioGen]、或音效庫（freesound.org / Sonniss GDC 免費包）。

---

## 8. 常見問題與修法

| 問題 | 解法 |
|------|------|
| 純音樂卻冒出人聲 | lyrics 只填 `[instrumental]`，tags 加 `no vocals` / `instrumental` |
| 人聲太大聲 | 加具體樂器標籤「rich instrumentation」；ComfyUI 調 `LatentOperationTonemapReinhard` multiplier 調低 |
| 風格混濁 | 移除矛盾標籤（別同時放 `ambient, metal` 或 `upbeat, melancholic`），收斂到 3–7 個 |
| 想融合曲風 | 用「主曲風 + 影響」寫法：`jazz, electronic elements, smooth, saxophone, synth pads` 而非兩個對等曲風 |
| 結果每次差很多 | 用 `ode` + 固定 `seed`；要多樣才用 `sde` |
| loop 接縫不順 | DAW 抓小節點，或用 base repaint 重繪接縫 |

---

## 9. Prompt 範本（直接複製改）

**戰鬥 BGM**
```
tags:   epic orchestral battle, war drums, brass, fast strings, intense, heroic, 140 BPM, instrumental
lyrics: [Intro - tense]
        [Build Up]
        [Main Theme - powerful]
        [Climax]
        [Outro]
```

**像素遊戲探索**
```
tags:   chiptune, 8-bit, upbeat, arpeggio, retro game, adventurous, 150 BPM, instrumental
lyrics: [instrumental]
```

**選單 ambient loop**
```
tags:   ambient, cinematic, soft synth pad, gentle piano, calm, hopeful, 70 BPM, instrumental
lyrics: [instrumental]
```
