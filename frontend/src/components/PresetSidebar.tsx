import { useGen } from '../stores/genStore'

const PRESETS: { label: string; base: string; duration: number }[] = [
  { label: '⚔ 戰鬥', base: 'epic orchestral battle, war drums, brass, fast strings, intense, 140 BPM', duration: 60 },
  { label: '👑 Boss 戰', base: 'dark epic orchestral, choir, heavy drums, dissonant brass, ominous, 150 BPM', duration: 75 },
  { label: '🗺 探索', base: 'orchestral adventure, strings, flute, light percussion, uplifting, 100 BPM', duration: 90 },
  { label: '🏠 小鎮', base: 'folk, acoustic guitar, accordion, warm, cozy, 110 BPM', duration: 60 },
  { label: '🎉 勝利', base: 'triumphant orchestral fanfare, brass, timpani, choir, 120 BPM', duration: 10 },
  { label: '👾 像素關卡', base: 'chiptune, 8-bit, energetic, arpeggio, retro game, 150 BPM', duration: 45 },
  { label: '🌫 環境氛圍', base: 'ambient, soft synth pad, gentle bells, calm, 70 BPM', duration: 60 },
]

export default function PresetSidebar() {
  const setBase = useGen((s) => s.setBase)
  const setParam = useGen((s) => s.setParam)

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-edge bg-panel p-3">
      <div className="px-1 pb-1 text-xs font-semibold text-txt-sec">場景範本</div>
      {PRESETS.map((p) => (
        <button
          key={p.label}
          onClick={() => {
            setBase(p.base)
            setParam('duration', p.duration)
          }}
          className="rounded-md px-3 py-2 text-left hover:bg-input"
        >
          <div className="text-sm">{p.label}</div>
          <div className="truncate text-[11px] text-txt-dim">
            {p.base.split(',').slice(0, 2).join(',')}
          </div>
        </button>
      ))}
    </aside>
  )
}
