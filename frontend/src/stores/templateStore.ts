import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Template {
  id: string
  name: string
  base: string
  extra: string
  instrumental: boolean
  duration: number
  model: string
}

interface TplState {
  items: Template[]
  add: (t: Omit<Template, 'id'>) => void
  remove: (id: string) => void
}

// 「我的模板」= 存好的設定，一鍵套用。存 localStorage。
export const useTemplates = create<TplState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (t) => set({ items: [{ ...t, id: crypto.randomUUID() }, ...get().items] }),
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
    }),
    { name: 'ace-studio-templates' },
  ),
)
