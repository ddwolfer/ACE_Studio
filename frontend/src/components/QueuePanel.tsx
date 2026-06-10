import { Loader2, X, Trash2 } from 'lucide-react'
import { useQueue } from '../stores/queueStore'

export default function QueuePanel() {
  const jobs = useQueue((s) => s.jobs)
  const removeJob = useQueue((s) => s.removeJob)
  const clear = useQueue((s) => s.clear)

  if (jobs.length === 0) return null

  return (
    <div className="shrink-0 border-t border-edge bg-panel/80 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-txt-sec">生成佇列 {jobs.length}</div>
        <button onClick={clear} className="flex items-center gap-1 text-[11px] text-txt-sec transition hover:text-danger">
          <Trash2 size={11} /> 清空等待
        </button>
      </div>
      <div className="flex max-h-44 flex-col gap-1 overflow-y-auto">
        {jobs.map((j) => (
          <div key={j.id} className="flex items-center gap-2 rounded-md bg-input px-2.5 py-1.5 text-[13px]">
            {j.status === 'running' && <Loader2 size={12} className="shrink-0 animate-spin text-secondary" />}
            <span className="min-w-0 flex-1 truncate">{j.label}</span>
            {j.status === 'running' && <span className="font-mono text-[11px] text-txt-dim">{j.progress}%</span>}
            {j.status === 'queued' && <span className="text-[11px] text-txt-dim">等待</span>}
            {j.status === 'error' && (
              <span className="text-[11px] text-danger" title={j.error}>
                失敗
              </span>
            )}
            {j.status !== 'running' && (
              <button onClick={() => removeJob(j.id)} className="shrink-0 text-txt-dim transition hover:text-danger" title="移除">
                <X size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
