import { Bookmark, Plus, Trash2 } from 'lucide-react'
import { useTemplates, type Template } from '../stores/templateStore'
import { useGen } from '../stores/genStore'

export default function TemplatesSection() {
  const items = useTemplates((s) => s.items)
  const add = useTemplates((s) => s.add)
  const remove = useTemplates((s) => s.remove)
  const g = useGen()

  const save = () => {
    const suggested = g.base.split(',')[0].trim().slice(0, 16) || '我的模板'
    const name = window.prompt('模板名稱', suggested)
    if (!name) return
    add({
      name,
      base: g.base,
      extra: g.extra,
      instrumental: g.instrumental,
      duration: g.params.duration,
      model: g.params.model,
    })
  }

  const apply = (t: Template) => {
    g.setBase(t.base)
    g.setExtra(t.extra)
    g.setInstrumental(t.instrumental)
    g.setParam('duration', t.duration)
    g.setParam('model', t.model)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-txt-sec">我的模板</div>
        <button onClick={save} className="flex items-center gap-1 text-[11px] text-txt-sec transition hover:text-primary">
          <Plus size={12} /> 存為模板
        </button>
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] text-txt-dim">把目前設定存成模板，下次一鍵套用</div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((t) => (
            <div key={t.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-input">
              <button onClick={() => apply(t)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <Bookmark size={13} className="shrink-0 text-txt-sec" />
                <span className="truncate text-[13px]">{t.name}</span>
              </button>
              <button
                onClick={() => remove(t.id)}
                className="text-txt-dim opacity-0 transition hover:text-danger group-hover:opacity-100"
                title="刪除模板"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
