# 音效 / Stinger / Ambient Prompt 範例庫

> 重要前提：ACE-Step 是「音樂生成器」，做的是**音樂性音效**（過場、jingle、氛圍）。
> 真正的離散 Foley（腳步、爆炸、刀劍、開門）**不是它的強項** → 見文末替代方案。

---

## A. 短 Stinger / Jingle（3–8 秒，生成後裁切）

設 `--duration` 短一點，生成後在 DAW 裁到精確長度。

| 用途 | tags |
|------|------|
| 過場 / 場景轉換 | `cinematic transition, swell, brass hit, riser, dramatic, short, instrumental` |
| 勝利 | `triumphant fanfare, bright brass, bells, short, victorious, instrumental` |
| 失敗 / Game Over | `descending sad piano, somber, short, melancholic, instrumental` |
| 升級 / 獲得 | `magical sparkle arpeggio, harp, bells, uplifting, short, instrumental` |
| 任務完成 | `success chime, glockenspiel, warm pad, short, satisfying, instrumental` |
| 危險警示 | `tense alarm, dissonant strings, pulsing, urgent, short, instrumental` |
| 神秘發現 | `mysterious shimmer, ethereal bells, reverb, short, instrumental` |

## B. UI 音效（音樂性，需後製裁到 <1 秒）

| 用途 | tags |
|------|------|
| 按鈕點擊 | `single bright synth chime, clean, very short, instrumental` |
| 選單開啟 | `soft bell, gentle pad swell, short, instrumental` |
| 確認 | `positive two-note chime, bell, short, instrumental` |
| 取消 / 錯誤 | `low descending tone, muted, short, instrumental` |

> 做法：duration 設 2–3 秒生成，取最前面有聲的片段，DAW 裁切並加快速 fade out。

## C. 環境氛圍 Ambient（可長放 30–120 秒）

ACE-Step 在這類「氛圍床」表現很好：

| 場景 | tags |
|------|------|
| 洞窟 | `dark ambient drone, cave, reverb, eerie, no melody, instrumental` |
| 太空 | `space ambient, ethereal pad, cosmic, slow, instrumental` |
| 森林 | `peaceful ambient, soft pad, gentle bells, nature, calm, instrumental` |
| 海底 | `underwater ambient, deep drone, muffled, mysterious, slow, instrumental` |
| 廢墟 / 末日 | `desolate ambient, low drone, distant echoes, bleak, instrumental` |
| 神殿 / 聖域 | `sacred ambient, choir pad, soft bells, reverent, ethereal, instrumental` |
| 賭場 / 都市 | `lounge jazz, soft piano, upright bass, smooth, background, instrumental` |

---

## D. 真正的離散 Foley 怎麼辦（ACE-Step 不適合）

像「劍碰撞」「腳步」「爆炸」「開門」這種 <1 秒的擬音：

1. **Stable Audio Open** — 開源、能 text-to-SFX，適合短音效。
2. **AudioGen / AudioLDM 2** — 文字生成環境音與音效。
3. **ElevenLabs Sound Effects** — 線上 text-to-SFX（品質高，付費）。
4. **免費音效庫**：
   - freesound.org（CC 授權）
   - Sonniss「GDC Game Audio Bundle」（每年釋出大量免費商用音效）
   - Kenney.nl（免費遊戲素材含音效）

> 建議分工：**BGM + 氛圍 + jingle 用 ACE-Step；離散 Foley 用上述工具/音效庫**。
