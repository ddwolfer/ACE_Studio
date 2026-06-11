import {
  Swords,
  Crown,
  Compass,
  Home,
  Trophy,
  Gamepad2,
  CloudFog,
  Coins,
  Rabbit,
  HeartCrack,
  Bomb,
  DoorOpen,
  Footprints,
  MousePointerClick,
  Sword,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ScenePreset {
  label: string
  Icon: LucideIcon
  base: string
  duration: number
}

// 寫法同 Suno 風格：配器 + 演奏法 + 情緒 + 場景 + 混音特徵 + BPM，越具體越穩定
export const PRESETS: ScenePreset[] = [
  {
    label: '戰鬥',
    Icon: Swords,
    base: 'epic orchestral battle music, pounding war drums and taiko percussion, aggressive staccato strings, heroic brass fanfares, soaring french horn melody, urgent rhythmic string ostinato, dark choir accents, cinematic hybrid orchestra, relentless forward drive, intense and heroic, fantasy action game combat theme, 140 BPM',
    duration: 60,
  },
  {
    label: 'Boss 戰',
    Icon: Crown,
    base: 'dark epic orchestral boss battle theme, massive taiko ensemble and thundering orchestral percussion, dissonant low brass clusters, menacing full choir chanting, shrieking high string runs, ominous pipe organ swells, towering cinematic climaxes, terrifying and unstoppable atmosphere, final boss confrontation, 150 BPM',
    duration: 75,
  },
  {
    label: '探索',
    Icon: Compass,
    base: 'orchestral adventure exploration theme, warm legato strings, wooden flute and oboe lead melody, gentle harp arpeggios, light hand percussion, distant horn calls answering the melody, open and airy mix with natural reverb, sense of wonder and discovery, rolling green hills and far horizons, optimistic, fantasy RPG overworld, 100 BPM',
    duration: 90,
  },
  {
    label: '小鎮',
    Icon: Home,
    base: 'cozy medieval town folk music, fingerpicked acoustic guitar, cheerful accordion lead melody, soft fiddle harmonies, mandolin flourishes, light tambourine and hand claps, warm and homely, villagers chatting around a market square, relaxed daytime atmosphere, fantasy village theme, 110 BPM',
    duration: 60,
  },
  {
    label: '勝利',
    Icon: Trophy,
    base: 'short triumphant victory fanfare, bold brass section hits, rolling timpani, bright trumpet melody rising to a glorious peak, celebratory choir swell, shimmering cymbal crash ending, proud and rewarding, quest complete jingle, 120 BPM',
    duration: 10,
  },
  {
    label: '像素關卡',
    Icon: Gamepad2,
    base: 'energetic chiptune platformer level theme, catchy 8-bit square wave lead melody, fast pulse-wave arpeggios, punchy NES-style noise channel drums, bouncy walking bassline, short looping hook that stays fun on repeat, bright and playful, retro pixel art game, 150 BPM',
    duration: 45,
  },
  {
    label: '環境氛圍',
    Icon: CloudFog,
    base: 'calm ambient atmosphere, soft slowly evolving synth pads, gentle bell tones, sparse piano notes with long reverb tails, subtle airy textures drifting in and out, very slow harmonic movement, dreamy and weightless, starlit night sky, peaceful rest area or menu screen, 70 BPM',
    duration: 60,
  },
]

// SFX 範本：描述「聲音事件」而非音樂 tags（SFX-ENGINE.md §7）；加上材質/衰減/錄音特徵更可控
export const SFX_PRESETS: ScenePreset[] = [
  { label: '金幣', Icon: Coins, base: 'retro game coin pickup, bright metallic ding, bell-like chime, fast decay, clean, no reverb', duration: 1 },
  { label: '跳躍', Icon: Rabbit, base: 'cartoon character jump, springy boing, quick upward pitch sweep, short and playful', duration: 1 },
  { label: '受傷', Icon: HeartCrack, base: 'player hurt sound, short grunt with dull body impact, quick thud, game damage feedback', duration: 1 },
  { label: '爆炸', Icon: Bomb, base: 'large explosion, deep boom with rumbling low end, fiery blast, falling debris tail, cinematic impact', duration: 2 },
  { label: '開門', Icon: DoorOpen, base: 'old heavy wooden door slowly creaking open, rusty hinge squeak, castle interior', duration: 2 },
  { label: '腳步', Icon: Footprints, base: 'footsteps walking on wooden floor, steady pace, leather boots, clean recording, no music', duration: 3 },
  { label: 'UI 點擊', Icon: MousePointerClick, base: 'ui button click, single short soft digital beep, clean tick, minimal, instant', duration: 0.5 },
  { label: '劍擊', Icon: Sword, base: 'metal sword clash, sharp steel clang with ringing tail, forceful strike, battle sound effect', duration: 1.5 },
]
