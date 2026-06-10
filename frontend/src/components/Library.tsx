import { Music, Trash2, Play, Copy } from 'lucide-react'
import { useLibrary } from '../stores/libraryStore'
import { useGen } from '../stores/genStore'
import { coverStyle } from '../lib/cover'

const dur = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export default function Library() {
  const items = useLibrary((s) => s.items)
  const remove = useLibrary((s) => s.remove)
  const setCurrent = useGen((s) => s.setCurrent)
  const current = useGen((s) => s.current)

  return (
    <main className="fade-up flex min-w-0 flex-1 flex-col" style={{ animationDelay: '0.12s' }}>
      <header className="flex items-center justify-between border-b border-edge px-6 py-4">
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight">我的作品</h1>
          <p className="text-xs text-txt-dim">
            {items.length > 0 ? `${items.length} 首 · 點封面播放` : '生成的 BGM 會收在這裡'}
          </p>
        </div>
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
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="mx-auto flex max-w-3xl flex-col gap-0.5">
            {items.map((it) => {
              const active = current?.id === it.id
              return (
                <div
                  key={it.id}
                  className={`group flex items-center gap-4 rounded-xl px-3 py-2.5 transition ${
                    active ? 'bg-input' : 'hover:bg-panel'
                  }`}
                >
                  <button
                    onClick={() => setCurrent(it)}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg"
                    style={coverStyle(it.id)}
                    title="播放"
                  >
                    <span className="absolute inset-0 grid place-items-center bg-black/25 text-white opacity-0 transition group-hover:opacity-100">
                      <Play size={18} />
                    </span>
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

                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => navigator.clipboard.writeText(it.finalCaption)}
                      className="grid h-8 w-8 place-items-center rounded-md text-txt-sec transition hover:bg-base hover:text-txt"
                      title="複製 prompt"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      onClick={() => remove(it.id)}
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
    </main>
  )
}
