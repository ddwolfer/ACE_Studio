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
    // 注意：引擎 /v1/models 會回傳 LLM 目錄（物件，含 pricing 等），不是 DiT 模型。
    // 只接受字串且過濾出 acestep-v15*；否則保留內建清單。確保 models 永遠是 string[]。
    try {
      const r = await api.models()
      const raw: any[] = Array.isArray(r) ? r : r?.data ?? r?.models ?? []
      const list = raw
        .map((x) => (typeof x === 'string' ? x : (x?.id ?? x?.name ?? '')))
        .filter((s: any): s is string => typeof s === 'string' && s.startsWith('acestep-v15'))
      if (list.length) {
        const merged = Array.from(new Set([...list, ...KNOWN_MODELS]))
        set({ models: merged, model: merged.includes(get().model) ? get().model : merged[0] })
      }
    } catch {
      /* 引擎未啟動或格式不符時忽略，維持內建清單 */
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
