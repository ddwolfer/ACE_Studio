import { create } from 'zustand'
import { api, parseResult } from '../api/acestepClient'
import { composeCaption } from '../lib/promptCompose'
import { useLibrary } from './libraryStore'
import type { GenParams, LibraryItem } from '../lib/types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface GenState {
  base: string
  extra: string
  instrumental: boolean
  lyrics: string
  params: GenParams
  status: 'idle' | 'generating' | 'done' | 'error'
  progress: number
  error: string | null
  current: LibraryItem | null
  setBase: (v: string) => void
  setExtra: (v: string) => void
  setLyrics: (v: string) => void
  setInstrumental: (v: boolean) => void
  autoTrim: boolean
  setAutoTrim: (v: boolean) => void
  setParam: <K extends keyof GenParams>(k: K, v: GenParams[K]) => void
  setCurrent: (item: LibraryItem) => void
  generate: () => Promise<void>
}

const defaultParams: GenParams = {
  model: 'acestep-v15-turbo', // 2B：8GB 友善（XL 4B 需 ≥12GB）
  duration: 60,
  steps: 8,
  cfg: 7,
  inferMethod: 'ode',
  seed: 42,
  useRandomSeed: true,
  format: 'wav',
}

function makeTitle(caption: string): string {
  const head = caption.split(',')[0].trim().slice(0, 24).replace(/\s+/g, '_')
  const t = new Date()
  const hh = String(t.getHours()).padStart(2, '0')
  const mm = String(t.getMinutes()).padStart(2, '0')
  return `${head || 'bgm'}_${hh}${mm}`
}

export const useGen = create<GenState>((set, get) => ({
  base: 'epic orchestral battle, war drums, brass, 140 BPM',
  extra: '',
  instrumental: true,
  lyrics: '[Instrumental]',
  autoTrim: true,
  params: defaultParams,
  status: 'idle',
  progress: 0,
  error: null,
  current: null,
  setBase: (v) => set({ base: v }),
  setExtra: (v) => set({ extra: v }),
  setLyrics: (v) => set({ lyrics: v }),
  setInstrumental: (v) => set({ instrumental: v }),
  setAutoTrim: (v) => set({ autoTrim: v }),
  setParam: (k, v) => set({ params: { ...get().params, [k]: v } as GenParams }),
  setCurrent: (item) => set({ current: item }),
  generate: async () => {
    const { base, extra, instrumental, lyrics, params } = get()
    const caption = composeCaption(base, extra)
    if (!caption) {
      set({ status: 'error', error: '請先輸入曲風描述' })
      return
    }
    const finalLyrics = instrumental ? '[Instrumental]' : lyrics || '[Instrumental]'
    set({ status: 'generating', progress: 4, error: null })
    try {
      const rel = await api.release({
        prompt: caption,
        lyrics: finalLyrics,
        model: params.model,
        audio_duration: params.duration,
        inference_steps: params.steps,
        guidance_scale: params.cfg,
        infer_method: params.inferMethod,
        use_random_seed: params.useRandomSeed,
        seed: params.useRandomSeed ? -1 : params.seed,
        audio_format: params.format,
        task_type: 'text2music',
        thinking: false,
        batch_size: 1,
      })
      const taskId: string | undefined =
        rel?.task_id ?? rel?.taskId ?? (Array.isArray(rel) ? rel[0]?.task_id : undefined)
      if (!taskId) throw new Error('未取得 task_id（檢查引擎回應格式）')

      for (let i = 0; i < 240; i++) {
        await delay(1500)
        const arr = await api.query(taskId)
        const outer = Array.isArray(arr) ? arr[0] : undefined
        const inner = outer ? parseResult(outer) : null
        if (!inner) continue
        if (typeof inner.progress === 'number') {
          set({ progress: Math.max(5, Math.round(inner.progress * 100)) })
        }
        const file = inner.file || ''
        const succeeded =
          inner.status === 1 || (inner.progress ?? 0) >= 1 || String(inner.stage).toLowerCase() === 'succeeded'
        if (succeeded && file) {
          const seedNum = inner.seed_value
            ? Number(String(inner.seed_value).split(',')[0]) || params.seed
            : params.seed
          const item: LibraryItem = {
            id: crypto.randomUUID(),
            title: makeTitle(caption),
            finalCaption: caption,
            base,
            extra,
            lyrics: finalLyrics,
            params: { ...params, seed: seedNum },
            audioPath: decodeURIComponent(file.split('path=')[1] || ''),
            audioUrl: api.audioUrl(file),
            durationSec: Number(inner.metas?.duration) || params.duration,
            type: 'bgm',
            createdAt: new Date().toISOString(),
          }
          // 生成後自動裁掉頭尾空白 → loop-ready 檔（需 run-local 本機服務；失敗則保留原檔）
          if (get().autoTrim) {
            try {
              const tr = await fetch('http://127.0.0.1:8787/trim-silence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: item.audioPath }),
              })
              const tj = await tr.json()
              if (tj?.ok && tj.out) {
                item.audioPath = tj.out
                item.audioUrl = '/api/v1/audio?path=' + encodeURIComponent(tj.out)
              }
            } catch {
              /* run-local 未啟動 → 用原檔 */
            }
          }
          useLibrary.getState().add(item)
          set({ status: 'done', progress: 100, current: item })
          return
        }
        if (String(inner.stage).toLowerCase().match(/fail|error/)) {
          throw new Error(inner.stage || '生成失敗')
        }
      }
      throw new Error('輪詢逾時（請確認引擎仍在運作）')
    } catch (e: any) {
      set({ status: 'error', error: e?.message ?? String(e) })
    }
  },
}))
