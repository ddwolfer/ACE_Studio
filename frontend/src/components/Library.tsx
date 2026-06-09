import { Music, Trash2, Play } from 'lucide-react'
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
    <aside
      className="fade-up flex w-80 shrink-0 flex-col gap-3 border-l border-edge bg-panel/60 p-3"
      style={{ animationDelay: '0.16s' }}
    >
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-txt-sec">音檔庫</div>
        {items.length > 0 && <div className="font-mono text-[11px] text-txt-dim">{items.length}</div>}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-txt-dim">
          <Music size={30} strokeWidth={1.5} />
          <div className="text-sm">還沒有任何音檔</div>
          <div className="text-xs">左側選個場景，生成第一首 🎵</div>
        </div>
      ) : (
        <div className="-mr-1 flex flex-col gap-0.5 overflow-y-auto pr-1">
          {items.map((it) => {
            const active = current?.id === it.id
            return (
              <div
                key={it.id}
                className={`group flex items-center gap-3 rounded-lg p-1.5 transition ${
                  active ? 'bg-input' : 'hover:bg-input/60'
                }`}
              >
                <button
                  onClick={() => setCurrent(it)}
                  className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md"
                  style={coverStyle(it.id)}
                  title="播放"
                >
                  <span className="absolute inset-0 grid place-items-center bg-black/20 text-white/90 opacity-0 transition group-hover:opacity-100">
                    <Play size={15} />
                  </span>
                  <span className="absolute bottom-0.5 right-0.5 rounded bg-black/55 px-1 font-mono text-[9px] leading-tight text-white/85">
                    {dur(it.durationSec)}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-[13px] ${active ? 'text-primary' : 'text-txt'}`}>
                    {it.title}
                  </div>
                  <div className="truncate text-[11px] text-txt-dim">{it.finalCaption}</div>
                </div>
                <button
                  onClick={() => remove(it.id)}
                  className="shrink-0 p-1 text-txt-dim opacity-0 transition hover:text-danger group-hover:opacity-100"
                  title="刪除"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
