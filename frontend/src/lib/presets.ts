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

export const PRESETS: ScenePreset[] = [
  { label: '戰鬥', Icon: Swords, base: 'epic orchestral battle, war drums, brass, fast strings, intense, 140 BPM', duration: 60 },
  { label: 'Boss 戰', Icon: Crown, base: 'dark epic orchestral, choir, heavy drums, dissonant brass, ominous, 150 BPM', duration: 75 },
  { label: '探索', Icon: Compass, base: 'orchestral adventure, strings, flute, light percussion, uplifting, 100 BPM', duration: 90 },
  { label: '小鎮', Icon: Home, base: 'folk, acoustic guitar, accordion, warm, cozy, 110 BPM', duration: 60 },
  { label: '勝利', Icon: Trophy, base: 'triumphant orchestral fanfare, brass, timpani, choir, 120 BPM', duration: 10 },
  { label: '像素關卡', Icon: Gamepad2, base: 'chiptune, 8-bit, energetic, arpeggio, retro game, 150 BPM', duration: 45 },
  { label: '環境氛圍', Icon: CloudFog, base: 'ambient, soft synth pad, gentle bells, calm, 70 BPM', duration: 60 },
]

// SFX 範本：描述「聲音事件」而非音樂 tags（SFX-ENGINE.md §7）
export const SFX_PRESETS: ScenePreset[] = [
  { label: '金幣', Icon: Coins, base: 'coin pickup, bright metallic ding, short', duration: 1 },
  { label: '跳躍', Icon: Rabbit, base: 'cartoon jump boing, short', duration: 1 },
  { label: '受傷', Icon: HeartCrack, base: 'player hurt grunt impact, short', duration: 1 },
  { label: '爆炸', Icon: Bomb, base: 'explosion blast debris', duration: 2 },
  { label: '開門', Icon: DoorOpen, base: 'wooden door creak open', duration: 2 },
  { label: '腳步', Icon: Footprints, base: 'footsteps on wood, walking', duration: 3 },
  { label: 'UI 點擊', Icon: MousePointerClick, base: 'ui button click beep, short', duration: 0.5 },
  { label: '劍擊', Icon: Sword, base: 'metal sword clash clang', duration: 1.5 },
]
