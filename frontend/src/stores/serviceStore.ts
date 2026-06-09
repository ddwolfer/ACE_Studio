import { create } from 'zustand'
import { api } from '../api/acestepClient'

interface ServiceState {
  models: string[]
  model: string
  ready: boolean
  initializing: boolean
  statusText: string
  error: string | null
  loadModels: () => Promise<void>
  setModel: (m: string) => void
  init: () => Promise<void>
}

// 2B turbo 為 8GB 友善預設；XL(4B) 需 ≥12GB（見 docs/WEB-UI-GUIDE）
const DEFAULT_MODEL = 'acestep-v15-turbo'
const KNOWN_MODELS = ['acestep-v15-turbo', 'acestep-v15-xl-turbo', 'acestep-v15-xl-sft']

export const useService = create<ServiceState>((set, get) => ({
  models: KNOWN_MODELS,
  model: DEFAULT_MODEL,
  ready: false,
  initializing: false,
  statusText: '未初始化',
  error: null,
  loadModels: async () => {
    try {
      const r = await api.models()
      const list: string[] = Array.isArray(r) ? r : r?.models ?? r?.dit_models ?? []
      if (list.length) {
        set({ models: list, model: list.includes(get().model) ? get().model : list[0] })
      }
    } catch {
      /* 引擎未啟動時忽略，維持預設清單 */
    }
  },
  setModel: (m) => set({ model: m }),
  init: async () => {
    set({ initializing: true, statusText: '載入中…', error: null })
    try {
      await api.init(get().model, false)
      set({ ready: true, initializing: false, statusText: '就緒' })
    } catch (e: any) {
      set({ initializing: false, ready: false, statusText: '錯誤', error: e?.message ?? String(e) })
    }
  },
}))
