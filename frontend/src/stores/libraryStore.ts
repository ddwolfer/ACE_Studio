import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LibraryItem } from '../lib/types'

interface LibState {
  items: LibraryItem[]
  add: (item: LibraryItem) => void
  remove: (id: string) => void
  clear: () => void
}

// M1：音檔庫存在 localStorage（落地 library.json 為 M3）
export const useLibrary = create<LibState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => set({ items: [item, ...get().items] }),
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'ace-studio-library' },
  ),
)
