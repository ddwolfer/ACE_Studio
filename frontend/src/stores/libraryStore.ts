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
  hydrate: () => Promise<void>
  add: (item: LibraryItem) => void
  remove: (id: string) => void
  clear: () => void
}

// M3：磁碟為主（library/library.json + library/audio/），localStorage 為快取與後備。
// 每次增刪都整份覆寫 library.json（量小，簡單可靠）。
export const useLibrary = create<LibState>()(
  persist(
    (set, get) => {
      const sync = () => {
        if (get().diskMode) void local.saveLibrary(get().items)
      }
      return {
        items: [],
        diskMode: false,
        dir: '',
        hydrate: async () => {
          const disk = await local.loadLibrary()
          if (!disk) return // run-local 沒開 → 維持 localStorage 模式
          if (disk.items.length > 0) {
            set({ items: disk.items, diskMode: true, dir: disk.dir })
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
        add: (item) => {
          set({ items: [item, ...get().items] })
          sync()
        },
        remove: (id) => {
          const it = get().items.find((i) => i.id === id)
          set({ items: get().items.filter((i) => i.id !== id) })
          sync()
          // 已落地的音檔一併刪除（只會動 library/audio/ 內、以該 id 命名的檔案）
          if (get().diskMode && it?.audioPath) {
            const name = it.audioPath.split(/[\\/]/).pop() ?? ''
            if (name.startsWith(it.id)) void local.deleteAudio(name)
          }
        },
        clear: () => {
          set({ items: [] })
          sync()
        },
      }
    },
    { name: 'ace-studio-library', partialize: (s) => ({ items: s.items }) },
  ),
)
