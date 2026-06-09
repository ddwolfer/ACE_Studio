import { Swords, Crown, Compass, Home, Trophy, Gamepad2, CloudFog } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ScenePreset {
  label: string
  Icon: LucideIcon
  base: string
  duration: number
}

export const PRESETS: ScenePreset[] = [
  { label: '戰鬥', Icon: Swords, base: 'epic orchestral battle, war drums, brass, fast strings, intense, 140 BPM', duration: 60 },
  { label: 'Boss 戰', Icon: Crown, base: 'dark epic orchestral, choir, heavy drums, dissonant brass, ominous, 150 BPM', duration: 75 },
  { label: '探索', Icon: Compass, base: 'orchestral adventure, strings, flute, light percussion, uplifting, 100 BPM', duration: 90 },
  { label: '小鎮', Icon: Home, base: 'folk, acoustic guitar, accordion, warm, cozy, 110 BPM', duration: 60 },
  { label: '勝利', Icon: Trophy, base: 'triumphant orchestral fanfare, brass, timpani, choir, 120 BPM', duration: 10 },
  { label: '像素關卡', Icon: Gamepad2, base: 'chiptune, 8-bit, energetic, arpeggio, retro game, 150 BPM', duration: 45 },
  { label: '環境氛圍', Icon: CloudFog, base: 'ambient, soft synth pad, gentle bells, calm, 70 BPM', duration: 60 },
]
