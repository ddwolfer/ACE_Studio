import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LibraryItem } from '../lib/types'
import { local } from '../lib/localHelper'

interface LibState {
  items: LibraryItem[]
  /** true = 已落地磁碟（library/library.json，需 run-local）；false = 退回 localStorage */
  diskMode: boolean
  /** library 資料夾的本機路徑（設定頁顯示 + 開資料夾用） */
  dir: string
  /** 磁碟上 library.json 的 updatedAt（輪詢比對用） */
  updatedAt: string
  hydrate: () => Promise<void>
  /** 輪詢：磁碟 updatedAt 變了（例如 MCP 生成入庫）就刷新清單 */
  refresh: () => Promise<void>
  add: (item: LibraryItem) => void
  remove: (id: string) => void
  clear: () => void
}

// M3：磁碟為主（library/library.json + library/audio/），localStorage 為快取與後備。
// M5：增刪改走 helper 的單筆原子端點（add-item/remove-item），與 MCP server 共用、不互相蓋寫。
export const useLibrary = create<LibState>()(
  persist(
    (set, get) => ({
      items: [],
      diskMode: false,
      dir: '',
      updatedAt: '',
      hydrate: async () => {
        const disk = await local.loadLibrary()
        if (!disk) return // run-local 沒開 → 維持 localStorage 模式
        if (disk.items.length > 0) {
          set({ items: disk.items, diskMode: true, dir: disk.dir, updatedAt: disk.updatedAt })
          return
        }
        // 磁碟還是空的：把 localStorage 既有作品搬上去（音檔若還在引擎暫存，順便複製出來）
        const migrated = await Promise.all(
          get().items.map(async (it) => {
            const imp = it.audioPath ? await local.importAudio(it.audioPath, it.id) : null
            return imp ? { ...it, audioPath: imp.path, audioUrl: imp.url } : it
          }),
        )
        set({ items: migrated, diskMode: true, dir: disk.dir })
        void local.saveLibrary(migrated)
      },
      refresh: async () => {
        if (!get().diskMode) return
        const disk = await local.loadLibrary()
        if (disk && disk.updatedAt && disk.updatedAt !== get().updatedAt) {
          set({ items: disk.items, updatedAt: disk.updatedAt })
        }
      },
      add: (item) => {
        set({ items: [item, ...get().items] })
        if (get().diskMode) void local.addItem(item)
      },
      remove: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
        // 音檔刪除由 helper 的 remove-item 連帶處理
        if (get().diskMode) void local.removeItem(id)
      },
      clear: () => {
        set({ items: [] })
        if (get().diskMode) void local.saveLibrary([])
      },
    }),
    { name: 'ace-studio-library', partialize: (s) => ({ items: s.items }) },
  ),
)
