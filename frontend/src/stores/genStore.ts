import { create } from 'zustand'
import type { GenParams, LibraryItem } from '../lib/types'

// 表單狀態 + 目前播放曲目。實際生成走 queueStore（統一佇列）。
interface GenState {
  base: string
  extra: string
  instrumental: boolean
  lyrics: string
  autoTrim: boolean
  params: GenParams
  current: LibraryItem | null
  setBase: (v: string) => void
  setExtra: (v: string) => void
  setLyrics: (v: string) => void
  setInstrumental: (v: boolean) => void
  setAutoTrim: (v: boolean) => void
  setParam: <K extends keyof GenParams>(k: K, v: GenParams[K]) => void
  setCurrent: (item: LibraryItem) => void
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

export const useGen = create<GenState>((set, get) => ({
  base: 'epic orchestral battle, war drums, brass, 140 BPM',
  extra: '',
  instrumental: true,
  lyrics: '[Instrumental]',
  autoTrim: true,
  params: defaultParams,
  current: null,
  setBase: (v) => set({ base: v }),
  setExtra: (v) => set({ extra: v }),
  setLyrics: (v) => set({ lyrics: v }),
  setInstrumental: (v) => set({ instrumental: v }),
  setAutoTrim: (v) => set({ autoTrim: v }),
  setParam: (k, v) => set({ params: { ...get().params, [k]: v } as GenParams }),
  setCurrent: (item) => set({ current: item }),
}))
