import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GenParams, LibraryItem } from '../lib/types'

// 表單狀態 + 目前播放曲目。實際生成走 queueStore（統一佇列）。
// M3：params / autoTrim / trimThresh 持久化（設定 modal 調整後跨重啟保留）。
interface GenState {
  /** 生成類型：bgm = ACE-Step(:8001)，sfx = Stable Audio Open(:8002) */
  genType: 'bgm' | 'sfx'
  base: string
  extra: string
  instrumental: boolean
  lyrics: string
  autoTrim: boolean
  /** 自動裁切的靜音判定閾值（振幅 0~1，越大裁越多） */
  trimThresh: number
  params: GenParams
  current: LibraryItem | null
  setGenType: (v: 'bgm' | 'sfx') => void
  setBase: (v: string) => void
  setExtra: (v: string) => void
  setLyrics: (v: string) => void
  setInstrumental: (v: boolean) => void
  setAutoTrim: (v: boolean) => void
  setTrimThresh: (v: number) => void
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

export const useGen = create<GenState>()(
  persist(
    (set, get) => ({
      genType: 'bgm',
      base: 'epic orchestral battle, war drums, brass, 140 BPM',
      extra: '',
      instrumental: true,
      lyrics: '[Instrumental]',
      autoTrim: true,
      trimThresh: 0.006,
      params: defaultParams,
      current: null,
      setGenType: (v) => set({ genType: v }),
      setBase: (v) => set({ base: v }),
      setExtra: (v) => set({ extra: v }),
      setLyrics: (v) => set({ lyrics: v }),
      setInstrumental: (v) => set({ instrumental: v }),
      setAutoTrim: (v) => set({ autoTrim: v }),
      setTrimThresh: (v) => set({ trimThresh: v }),
      setParam: (k, v) => set({ params: { ...get().params, [k]: v } as GenParams }),
      setCurrent: (item) => set({ current: item }),
    }),
    {
      name: 'ace-studio-gen',
      partialize: (s) => ({ params: s.params, autoTrim: s.autoTrim, trimThresh: s.trimThresh }),
      // params 深合併：日後新增參數時，舊的 localStorage 不會蓋掉新預設值
      merge: (persisted: any, current) => ({
        ...current,
        ...(persisted ?? {}),
        params: { ...current.params, ...(persisted?.params ?? {}) },
      }),
    },
  ),
)
