import { Music, ChevronDown, Settings, RefreshCw } from 'lucide-react'
import { useService } from '../stores/serviceStore'

export default function TopBar() {
  const { models, model, setModel, ready, initializing, statusText, init } = useService()
  const dot = ready
    ? 'bg-primary'
    : initializing
      ? 'bg-secondary'
      : statusText === '錯誤'
        ? 'bg-danger'
        : 'bg-txt-dim'

  return (
    <header
      className="fade-up flex items-center gap-4 border-b border-edge bg-panel/90 px-5 backdrop-blur"
      style={{ height: 52 }}
    >
      <div className="flex items-center gap-2">
        <Music size={18} className="text-primary" />
        <span className="text-sm font-extrabold uppercase tracking-[0.2em]">
          ACE <span className="text-txt-sec">Studio</span>
        </span>
      </div>
      <div className="flex-1" />
      <label className="flex items-center gap-2 rounded-md bg-input px-3 py-1.5 text-xs text-txt-sec">
        <span>模型</span>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="bg-transparent font-mono text-txt outline-none"
        >
          {models.map((m) => (
            <option key={m} value={m} className="bg-panel">
              {m}
            </option>
          ))}
        </select>
        <ChevronDown size={14} />
      </label>
      <div className="flex items-center gap-2 text-xs">
        <span className={`inline-block h-2 w-2 rounded-full ${dot} ${ready || initializing ? 'dot-pulse' : ''}`} />
        <span className={ready ? 'text-primary' : 'text-txt-sec'}>{statusText}</span>
      </div>
      <button
        onClick={() => init()}
        disabled={initializing}
        className="flex items-center gap-1.5 rounded-md border border-edge px-3 py-1.5 text-xs text-txt-sec hover:text-txt disabled:opacity-50"
      >
        <RefreshCw size={13} className={initializing ? 'animate-spin' : ''} />
        初始化服務
      </button>
      <Settings size={18} className="text-txt-sec" />
    </header>
  )
}
