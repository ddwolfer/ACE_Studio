import { Music } from 'lucide-react'
import { useGen } from '../stores/genStore'
import { useService } from '../stores/serviceStore'
import { composeCaption } from '../lib/promptCompose'

export default function SingleGen() {
  const g = useGen()
  const ready = useService((s) => s.ready)
  const final = composeCaption(g.base, g.extra)
  const busy = g.status === 'generating'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-2 block text-xs font-medium text-txt-sec">曲風描述 (Caption)</label>
        <textarea
          value={g.base}
          onChange={(e) => g.setBase(e.target.value)}
          rows={3}
          placeholder="例：epic orchestral battle, war drums, 140 BPM"
          className="w-full resize-none rounded-md border border-edge bg-input p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-txt-sec">額外 prompt（選填）</label>
        <input
          value={g.extra}
          onChange={(e) => g.setExtra(e.target.value)}
          placeholder="例：lots of reverb, wide stereo"
          className="w-full rounded-md border border-edge bg-input p-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={g.instrumental}
          onChange={(e) => g.setInstrumental(e.target.checked)}
          className="accent-primary"
        />
        純音樂 (Instrumental)
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={g.autoTrim}
          onChange={(e) => g.setAutoTrim(e.target.checked)}
          className="accent-primary"
        />
        <span>
          自動裁頭尾空白{' '}
          <span className="text-xs text-txt-dim">(loop-ready，需 run-local)</span>
        </span>
      </label>

      <div className={g.instrumental ? 'opacity-40' : ''}>
        <label className="mb-2 block text-xs font-medium text-txt-sec">歌詞 (Lyrics)</label>
        <textarea
          value={g.instrumental ? '[Instrumental]' : g.lyrics}
          disabled={g.instrumental}
          onChange={(e) => g.setLyrics(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border border-edge bg-input p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <div className="mb-2 flex justify-between text-xs">
          <span className="font-medium text-txt-sec">長度（最小 5 秒）</span>
          <span className="font-mono text-primary">{g.params.duration} 秒</span>
        </div>
        <input
          type="range"
          min={5}
          max={120}
          step={1}
          value={g.params.duration}
          onChange={(e) => g.setParam('duration', Number(e.target.value))}
          className="range w-full"
        />
      </div>

      <div className="rounded-md border border-edge bg-base p-3 text-xs">
        <span className="text-txt-dim">最終 prompt：</span>
        <span className="font-mono text-txt">{final || '（空）'}</span>
      </div>

      {g.error && (
        <div className="rounded-md border-l-2 border-danger bg-danger/10 p-2 text-xs text-danger">
          {g.error}
        </div>
      )}

      <button
        onClick={() => g.generate()}
        disabled={!ready || busy}
        className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-[#0E1014] transition hover:brightness-105 active:scale-[.99] disabled:opacity-40"
      >
        <Music size={18} />
        {busy ? `生成中… ${g.progress}%` : ready ? '生成音樂' : '請先初始化服務'}
      </button>
    </div>
  )
}
