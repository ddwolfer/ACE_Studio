# 遊戲 BGM Prompt 範例庫

> 全部為純音樂。tags 直接複製貼到 CLI `--tags` 或 ComfyUI 的 TextEncodeAceStepAudio.tags；
> lyrics 一律填 `[instrumental]`（或用結構標籤鋪陳）。建議 turbo 8 步先試、sft 50 步定稿。

---

## 標題 / 選單
```
ambient, cinematic, soft synth pad, gentle piano, calm, hopeful, 70 BPM, instrumental
```
```
ethereal pad, soft strings, music box, dreamy, peaceful, 65 BPM, instrumental
```

## 探索 / 世界地圖
```
orchestral adventure, strings, flute, light percussion, uplifting, wonder, 100 BPM, instrumental
```
```
celtic folk, fiddle, tin whistle, acoustic guitar, adventurous, 110 BPM, instrumental
```

## 小鎮 / 安全區
```
folk, acoustic guitar, accordion, warm, cozy, playful, 110 BPM, instrumental
```
```
jazz cafe, soft piano, brushed drums, upright bass, relaxed, 95 BPM, instrumental
```

## 一般戰鬥
```
epic orchestral battle, war drums, brass, fast strings, intense, heroic, 140 BPM, instrumental
```
```
hybrid orchestral rock, electric guitar, drums, strings, driving, aggressive, 145 BPM, instrumental
```
結構鋪陳（lyrics）：
```
[Intro - tense]
[Build Up]
[Main Theme - powerful]
[Climax]
[Outro]
```

## Boss 戰
```
dark epic orchestral, choir, heavy drums, dissonant brass, ominous, powerful, 150 BPM, instrumental
```
```
metal orchestral hybrid, double bass drums, distorted guitar, choir, menacing, 160 BPM, instrumental
```

## 潛行 / 緊張 / 懸疑
```
dark ambient, low drone, sparse percussion, tense, eerie, 80 BPM, instrumental
```
```
suspense cinematic, pulsing bass, ticking percussion, anxious, 90 BPM, instrumental
```

## 悲傷 / 劇情過場
```
emotional piano, soft strings, melancholic, slow, cinematic, 60 BPM, instrumental
```

## 復古 / 像素遊戲
```
chiptune, 8-bit, energetic, arpeggio, retro game, adventurous, 150 BPM, instrumental
```
```
chiptune, 8-bit, boss theme, fast arpeggio, intense, retro game, 165 BPM, instrumental
```

## 賽車 / 動作
```
electronic, synthwave, driving bass, punchy drums, energetic, fast, 150 BPM, instrumental
```

## 太空 / 科幻
```
space ambient, ethereal pad, cosmic, slow, mysterious, instrumental
```
```
sci-fi electronic, arpeggiated synth, pulsing bass, futuristic, 120 BPM, instrumental
```

## 恐怖
```
horror ambient, dissonant strings, low drone, unsettling, eerie, instrumental
```

---

### 做 loop 的小抄
- 固定 BPM（如 120），4/4 拍，每 8 小節 = 16 秒，方便對齊。
- 生成稍長 → 在 Audacity/Reaper 抓乾淨小節點裁 loop。
- 接縫不順 → 用 ACE-Step base 的 repaint 重繪頭尾。
