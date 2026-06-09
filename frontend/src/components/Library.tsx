import { Music, Trash2, Play } from 'lucide-react'
import { useLibrary } from '../stores/libraryStore'
import { useGen } from '../stores/genStore'

export default function Library() {
  const items = useLibrary((s) => s.items)
  const remove = useLibrary((s) => s.remove)
  const setCurrent = useGen((s) => s.setCurrent)

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-3 border-l border-edge bg-panel p-3">
      <div className="text-xs font-semibold text-txt-sec">音檔庫</div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-txt-dim">
          <Music size={32} />
          <div className="text-sm">還沒有任何音檔</div>
          <div className="text-xs">左側選個場景，生成第一首 🎵</div>
        </div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {items.map((it) => (
            <div key={it.id} className="group flex items-center gap-2 rounded-md p-2 hover:bg-input">
              <button onClick={() => setCurrent(it)} className="text-primary">
                <Play size={14} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{it.title}</div>
                <div className="truncate text-[11px] text-txt-dim">
                  {it.durationSec}s · {it.finalCaption}
                </div>
              </div>
              <button
                onClick={() => remove(it.id)}
                className="text-txt-dim opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
