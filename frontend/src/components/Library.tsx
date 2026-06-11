import { useState } from 'react'
import { Music, Trash2, Play, Copy, Download, Check, X } from 'lucide-react'
import { useLibrary } from '../stores/libraryStore'
import { useGen } from '../stores/genStore'
import { coverStyle } from '../lib/cover'
import { exportZip } from '../lib/exportZip'
import ConfirmDialog from './ConfirmDialog'
import type { LibraryItem } from '../lib/types'

const dur = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

type Filter = 'all' | 'bgm' | 'sfx'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'bgm', label: 'BGM' },
  { key: 'sfx', label: 'SFX' },
]

export default function Library() {
  const items = useLibrary((s) => s.items)
  const remove = useLibrary((s) => s.remove)
  const setCurrent = useGen((s) => s.setCurrent)
  const current = useGen((s) => s.current)
  const [filter, setFilter] = useState<Filter>('all')
  const [pendingDelete, setPendingDelete] = useState<LibraryItem | null>(null)
  // 匯出選取模式（M5 後追加）：勾選多個作品 → 打包 zip 下載（含 manifest.json）
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [zipping, setZipping] = useState(false)
  // 舊資料沒有 type 欄位 → 視為 bgm
  const shown = items.filter((it) =>
    filter === 'all' ? true : filter === 'sfx' ? it.type === 'sfx' : it.type !== 'sfx',
  )

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const toggleAll = () =>
    setSelected(selected.size === shown.length ? new Set() : new Set(shown.map((i) => i.id)))
  const exitSelect = () => {
    setSelecting(false)
    setSelected(new Set())
  }
  const doExport = async () => {
    const chosen = items.filter((i) => selected.has(i.id))
    if (chosen.length === 0) return
    setZipping(true)
    try {
      await exportZip(chosen)
      exitSelect()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setZipping(false)
    }
  }

  return (
    <main className="fade-up flex min-w-0 flex-1 flex-col" style={{ animationDelay: '0.12s' }}>
      <header className="flex items-center justify-between border-b border-edge px-6 py-4">
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight">我的作品</h1>
          <p className="text-xs text-txt-dim">
            {items.length > 0 ? `${shown.length} 首 · 點封面播放` : '生成的 BGM 會收在這裡'}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            {selecting ? (
              <>
                <span className="font-mono text-xs text-txt-dim">已選 {selected.size}</span>
                <button
                  onClick={toggleAll}
                  className="rounded-md border border-edge px-3 py-1.5 text-xs text-txt-sec transition hover:text-txt"
                >
                  {selected.size === shown.length && shown.length > 0 ? '取消全選' : '全選'}
                </button>
                <button
                  onClick={() => void doExport()}
                  disabled={selected.size === 0 || zipping}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-[#14110E] transition hover:brightness-105 disabled:opacity-40"
                >
                  <Download size={13} />
                  {zipping ? '打包中…' : `打包下載 (${selected.size})`}
                </button>
                <button
                  onClick={exitSelect}
                  className="grid h-7 w-7 place-items-center rounded-md text-txt-sec transition hover:bg-panel hover:text-txt"
                  title="離開選取模式"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <div className="flex rounded-lg border border-edge bg-base p-0.5">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                        filter === f.key ? 'bg-input text-primary' : 'text-txt-sec hover:text-txt'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelecting(true)}
                  className="flex items-center gap-1.5 rounded-md border border-edge px-3 py-1.5 text-xs text-txt-sec transition hover:text-txt"
                  title="勾選多個作品，打包 zip 下載（含 manifest.json）"
                >
                  <Download size={13} /> 匯出
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-txt-dim">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl"
            style={coverStyle('empty-state-seed')}
          >
            <Music size={26} className="text-white/85" strokeWidth={1.75} />
          </div>
          <div className="text-sm text-txt-sec">還沒有任何作品</div>
          <div className="text-xs">從左側選個場景，生成你的第一首 BGM</div>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-txt-dim">
          沒有{filter === 'sfx' ? ' SFX' : ' BGM'} 類型的作品
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="mx-auto flex max-w-3xl flex-col gap-0.5">
            {shown.map((it) => {
              const active = current?.id === it.id
              const picked = selected.has(it.id)
              return (
                <div
                  key={it.id}
                  onClick={selecting ? () => toggle(it.id) : undefined}
                  className={`group flex items-center gap-4 rounded-xl px-3 py-2.5 transition ${
                    selecting ? 'cursor-pointer' : ''
                  } ${picked ? 'bg-input ring-1 ring-primary/40' : active && !selecting ? 'bg-input' : 'hover:bg-panel'}`}
                >
                  {selecting && (
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded border transition ${
                        picked ? 'border-primary bg-primary text-[#14110E]' : 'border-edge text-transparent'
                      }`}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                  <button
                    onClick={selecting ? undefined : () => setCurrent(it)}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg"
                    style={coverStyle(it.id)}
                    title={selecting ? undefined : '播放'}
                  >
                    {!selecting && (
                      <span className="absolute inset-0 grid place-items-center bg-black/25 text-white opacity-0 transition group-hover:opacity-100">
                        <Play size={18} />
                      </span>
                    )}
                    <span className="absolute bottom-1 right-1 rounded bg-black/55 px-1 font-mono text-[9px] leading-tight text-white/85">
                      {dur(it.durationSec)}
                    </span>
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`truncate text-[15px] font-medium ${active ? 'text-primary' : 'text-txt'}`}>
                        {it.title}
                      </span>
                      {it.type === 'sfx' && (
                        <span className="shrink-0 rounded border border-edge px-1 py-px font-mono text-[9px] uppercase tracking-wider text-txt-sec">
                          sfx
                        </span>
                      )}
                    </div>
                    <div className="line-clamp-2 text-xs leading-snug text-txt-dim">{it.finalCaption}</div>
                  </div>

                  <div
                    className={`flex shrink-0 items-center gap-1 transition ${
                      selecting ? 'pointer-events-none opacity-0' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <button
                      onClick={() => navigator.clipboard.writeText(it.finalCaption)}
                      className="grid h-8 w-8 place-items-center rounded-md text-txt-sec transition hover:bg-base hover:text-txt"
                      title="複製 prompt"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={() => setPendingDelete(it)}
                      className="grid h-8 w-8 place-items-center rounded-md text-txt-sec transition hover:bg-base hover:text-danger"
                      title="刪除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="刪除作品"
          message={`確定要刪除「${pendingDelete.title}」嗎？磁碟上的音檔會一併刪除，無法復原。`}
          onConfirm={() => {
            remove(pendingDelete.id)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </main>
  )
}
