import { zipSync, strToU8 } from 'fflate'
import type { LibraryItem } from './types'

const sanitize = (s: string) => s.replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 60) || 'track'

/** 把選取的作品打包成 zip 下載：音檔 + manifest.json（prompt/種子/長度，方便之後重生微調） */
export async function exportZip(items: LibraryItem[]): Promise<void> {
  const files: Record<string, Uint8Array> = {}
  const used = new Set<string>()

  for (const it of items) {
    const r = await fetch(it.audioUrl)
    if (!r.ok) throw new Error(`抓不到音檔：${it.title}（檔案可能已被移動或 run-local 沒開）`)
    const ext = (/\.\w+$/.exec(it.audioPath)?.[0] ?? '.wav').toLowerCase()
    const stem = sanitize(it.title)
    let name = stem + ext
    for (let i = 2; used.has(name); i++) name = `${stem}-${i}${ext}`
    used.add(name)
    files[name] = new Uint8Array(await r.arrayBuffer())
  }

  const manifest = items.map((it) => ({
    title: it.title,
    type: it.type,
    durationSec: it.durationSec,
    prompt: it.finalCaption,
    lyrics: it.lyrics || undefined,
    seed: it.params?.seed,
    model: it.params?.model,
    createdAt: it.createdAt,
  }))
  files['manifest.json'] = strToU8(JSON.stringify(manifest, null, 2))

  const t = new Date()
  const stamp =
    `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}` +
    `-${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}`
  const blob = new Blob([zipSync(files)], { type: 'application/zip' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `ace-studio-export_${stamp}.zip`
  a.click()
  URL.revokeObjectURL(a.href)
}
