import { PRESETS, SFX_PRESETS } from '../lib/presets'
import { useGen } from '../stores/genStore'

export default function PresetSidebar() {
  const genType = useGen((s) => s.genType)
  const setBase = useGen((s) => s.setBase)
  const setParam = useGen((s) => s.setParam)
  const list = genType === 'sfx' ? SFX_PRESETS : PRESETS

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-txt-sec">
        {genType === 'sfx' ? '音效範本' : '場景範本'}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {list.map(({ label, Icon, base, duration }) => (
          <button
            key={label}
            onClick={() => {
              setBase(base)
              setParam('duration', duration)
            }}
            className="flex items-center gap-2 rounded-lg border border-edge/70 bg-base/40 px-3 py-2 text-left text-[13px] transition hover:border-primary/40 hover:bg-input"
          >
            <Icon size={15} className="shrink-0 text-txt-sec" strokeWidth={1.75} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
