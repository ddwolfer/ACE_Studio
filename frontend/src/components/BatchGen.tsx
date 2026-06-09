import { useState } from 'react'
import { Check, ListPlus, Play, Trash2 } from 'lucide-react'
import { PRESETS } from '../lib/presets'
import { useBatch } from '../stores/batchStore'

const statusText: Record<string, string> = { queued: '等待', running: '生成中', done: '完成', error: '失敗' }
const statusColor: Record<string, string> = {
  queued: 'text-txt-dim',
  running: 'text-secondary',
  done: 'text-primary',
  error: 'text-danger',
}

export default function BatchGen() {
  const { jobs, running, extra, setExtra, enqueue, clear, start } = useBatch()
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [count, setCount] = useState(1)

  const toggle = (label: string) => setSel((s) => ({ ...s, [label]: !s[label] }))
  const addToQueue = () => {
    const items: { label: string; base: string; duration: number }[] = []
    for (const p of PRESETS.filter((p) => sel[p.label])) {
      for (let i = 0; i < count; i++) items.push({ label: p.label, base: p.base, duration: p.duration })
    }
    if (items.length) enqueue(items)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-txt-dim">選多個場景＋共用額外 prompt，一次排隊生成（逐一進行）。</p>

      <div>
        <label className="mb-2 block text-xs font-medium text-txt-sec">額外 prompt（套用到所有場景）</label>
        <input
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="例：lots of reverb, 8-bit retro"
          className="w-full rounded-md border border-edge bg-input p-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-txt-sec">選擇場景</label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => toggle(p.label)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition ${
                sel[p.label] ? 'border-primary/60 bg-input' : 'border-edge/70 bg-base/40 hover:bg-input'
              }`}
            >
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                  sel[p.label] ? 'border-primary bg-primary text-[#14110E]' : 'border-edge'
                }`}
              >
                {sel[p.label] && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-txt-sec">每場景</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setCount((c) => Math.max(1, c - 1))} className="grid h-6 w-6 place-items-center rounded bg-input text-txt-sec">−</button>
          <span className="w-5 text-center font-mono text-sm">{count}</span>
          <button onClick={() => setCount((c) => Math.min(5, c + 1))} className="grid h-6 w-6 place-items-center rounded bg-input text-txt-sec">+</button>
        </div>
        <span className="text-txt-sec">首</span>
        <div className="flex-1" />
        <button
          onClick={addToQueue}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-[#14110E] transition hover:brightness-105"
        >
          <ListPlus size={14} /> 加入佇列
        </button>
      </div>

      {jobs.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-txt-sec">佇列 {jobs.length}</span>
            <div className="flex gap-3">
              <button onClick={start} disabled={running} className="flex items-center gap-1 text-xs text-primary transition disabled:opacity-40">
                <Play size={12} /> {running ? '生成中…' : '開始'}
              </button>
              <button onClick={clear} className="flex items-center gap-1 text-xs text-txt-sec transition hover:text-danger">
                <Trash2 size={12} /> 清空
              </button>
            </div>
          </div>
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-2 rounded-md bg-input px-2.5 py-1.5 text-[13px]">
              <span className="min-w-0 flex-1 truncate">{j.label}</span>
              {j.status === 'running' && <span className="font-mono text-[11px] text-txt-dim">{j.progress}%</span>}
              <span className={`text-[11px] ${statusColor[j.status]}`}>{statusText[j.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
