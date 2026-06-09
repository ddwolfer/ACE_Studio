import { create } from 'zustand'
import { generateTrack } from '../lib/generate'
import { useLibrary } from './libraryStore'
import { useGen } from './genStore'

export type BatchStatus = 'queued' | 'running' | 'done' | 'error'

export interface BatchJob {
  id: string
  label: string
  base: string
  duration: number
  status: BatchStatus
  progress: number
}

interface BatchState {
  jobs: BatchJob[]
  running: boolean
  extra: string
  setExtra: (v: string) => void
  enqueue: (items: { label: string; base: string; duration: number }[]) => void
  clear: () => void
  start: () => Promise<void>
}

// 批次：因引擎 workers=1，序列化逐一生成（一首完成才送下一首）。
export const useBatch = create<BatchState>((set, get) => ({
  jobs: [],
  running: false,
  extra: '',
  setExtra: (v) => set({ extra: v }),
  enqueue: (items) =>
    set({
      jobs: [
        ...get().jobs,
        ...items.map((it) => ({ id: crypto.randomUUID(), ...it, status: 'queued' as BatchStatus, progress: 0 })),
      ],
    }),
  clear: () => set({ jobs: get().jobs.filter((j) => j.status === 'running') }),
  start: async () => {
    if (get().running) return
    set({ running: true })
    const gen = useGen.getState()
    const params = gen.params
    const autoTrim = gen.autoTrim
    const extra = get().extra
    const patch = (id: string, p: Partial<BatchJob>) =>
      set({ jobs: get().jobs.map((j) => (j.id === id ? { ...j, ...p } : j)) })
    try {
      for (;;) {
        const job = get().jobs.find((j) => j.status === 'queued')
        if (!job) break
        patch(job.id, { status: 'running', progress: 0 })
        try {
          const item = await generateTrack(
            {
              base: job.base,
              extra,
              instrumental: true,
              lyrics: '[Instrumental]',
              params: { ...params, duration: job.duration },
              autoTrim,
            },
            (p) => patch(job.id, { progress: p }),
          )
          useLibrary.getState().add(item)
          patch(job.id, { status: 'done', progress: 100 })
        } catch {
          patch(job.id, { status: 'error' })
        }
      }
    } finally {
      set({ running: false })
    }
  },
}))
