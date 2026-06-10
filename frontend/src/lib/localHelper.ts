import type { LibraryItem } from './types'

// 本機小幫手（run-local，:8787）client。
// 所有需要碰本機檔案系統的操作都走這裡：開資料夾、裁靜音、音檔庫落地。
export const HELPER = 'http://127.0.0.1:8787'

async function post(pathname: string, body: unknown): Promise<any> {
  const r = await fetch(HELPER + pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json()
}

export const local = {
  health: async (): Promise<boolean> => {
    try {
      return (await fetch(HELPER + '/health')).ok
    } catch {
      return false
    }
  },
  openFolder: (path: string) => post('/open-folder', { path }),
  /** 裁頭尾靜音，回傳 _loop.wav 路徑；helper 沒開或失敗回 null */
  trimSilence: async (path: string, thresh?: number): Promise<string | null> => {
    try {
      const j = await post('/trim-silence', { path, thresh })
      return j?.ok && j.out ? j.out : null
    } catch {
      return null
    }
  },
  /** 讀磁碟上的 library.json；helper 沒開回 null */
  loadLibrary: async (): Promise<{ items: LibraryItem[]; dir: string } | null> => {
    try {
      const j = await (await fetch(HELPER + '/library')).json()
      return j?.ok ? { items: j.items ?? [], dir: j.dir ?? '' } : null
    } catch {
      return null
    }
  },
  saveLibrary: (items: LibraryItem[]) => post('/library', { items }).catch(() => null),
  /** 把引擎暫存的音檔複製進 library/audio/，回傳新路徑與播放 URL */
  importAudio: async (path: string, id: string): Promise<{ path: string; url: string } | null> => {
    try {
      const j = await post('/library/import-audio', { path, id })
      return j?.ok ? { path: j.path, url: j.url } : null
    } catch {
      return null
    }
  },
  deleteAudio: (filename: string) => post('/library/delete-audio', { filename }).catch(() => null),
}
