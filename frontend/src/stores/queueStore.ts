import { create } from 'zustand'
import { generateTrack } from '../lib/generate'
import type { GenInput } from '../lib/generate'
import { useLibrary } from './libraryStore'
import { useGen } from './genStore'

export type JobStatus = 'queued' | 'running' | 'error'

export interface QueueJob {
  id: string
  label: string
  input: GenInput
  status: JobStatus
  progress: number
  error?: string
}

interface QueueState {
  jobs: QueueJob[]
  running: boolean
  enqueue: (input: GenInput, label: string) => void
  removeJob: (id: string) => void
  clear: () => void
  run: () => Promise<void>
}

// 統一生成佇列：所有生成都進這裡，逐一處理（引擎 workers=1）。完成的進音檔庫並設為目前曲目。
export const useQueue = create<QueueState>((set, get) => ({
  jobs: [],
  running: false,
  enqueue: (input, label) => {
    set({
      jobs: [...get().jobs, { id: crypto.randomUUID(), label, input, status: 'queued', progress: 0 }],
    })
    if (!get().running) void get().run()
  },
  removeJob: (id) => set({ jobs: get().jobs.filter((j) => !(j.id === id && j.status !== 'running')) }),
  clear: () => set({ jobs: get().jobs.filter((j) => j.status === 'running') }),
  run: async () => {
    if (get().running) return
    set({ running: true })
    const patch = (id: string, p: Partial<QueueJob>) =>
      set({ jobs: get().jobs.map((j) => (j.id === id ? { ...j, ...p } : j)) })
    try {
      for (;;) {
        const job = get().jobs.find((j) => j.status === 'queued')
        if (!job) break
        patch(job.id, { status: 'running', progress: 0 })
        try {
          const item = await generateTrack(job.input, (pr) => patch(job.id, { progress: pr }))
          useLibrary.getState().add(item)
          useGen.getState().setCurrent(item)
          // 完成 → 從佇列移除（已在音檔庫）
          set({ jobs: get().jobs.filter((j) => j.id !== job.id) })
        } catch (e: any) {
          patch(job.id, { status: 'error', error: String(e?.message ?? e) })
        }
      }
    } finally {
      set({ running: false })
    }
  },
}))
