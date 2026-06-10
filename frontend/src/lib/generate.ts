import { api, parseResult } from '../api/acestepClient'
import { composeCaption } from './promptCompose'
import { local } from './localHelper'
import type { GenParams, LibraryItem } from './types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface GenInput {
  /** bgm = ACE-Step(:8001 經 /api)，sfx = Stable Audio Open(:8002 經 /sfx) */
  type: 'bgm' | 'sfx'
  base: string
  extra: string
  instrumental: boolean
  lyrics: string
  params: GenParams
  autoTrim: boolean
  /** 自動裁切的靜音閾值（未給用腳本預設 0.006） */
  trimThresh?: number
}

function makeTitle(caption: string): string {
  const head = caption.split(',')[0].trim().slice(0, 24).replace(/\s+/g, '_')
  const t = new Date()
  return `${head || 'bgm'}_${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}`
}

// 共用收尾：（可選）裁頭尾靜音 → 落地 library/audio/（脫離引擎暫存）
async function finalizeItem(item: LibraryItem, autoTrim: boolean, trimThresh?: number): Promise<void> {
  if (autoTrim) {
    const out = await local.trimSilence(item.audioPath, trimThresh)
    if (out) {
      item.audioPath = out
      item.audioUrl = '/api/v1/audio?path=' + encodeURIComponent(out)
    }
  }
  const imp = await local.importAudio(item.audioPath, item.id)
  if (imp) {
    item.audioPath = imp.path
    item.audioUrl = imp.url
  }
}

// SFX：同步請求（SAO 生成 0.5~8 秒短音，GPU 約十幾秒），無輪詢
async function generateSfx(input: GenInput, onProgress?: (p: number) => void): Promise<LibraryItem> {
  const { base, extra, params, autoTrim, trimThresh } = input
  const caption = composeCaption(base, extra)
  if (!caption) throw new Error('請先輸入音效描述')
  onProgress?.(8)
  const r = await fetch('/sfx/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: caption,
      duration: params.duration,
      seed: params.useRandomSeed ? -1 : params.seed,
      steps: 100, // SAO 建議 100~200（與 BGM turbo 的 8 步不同，故不沿用 params.steps）
      cfg: params.cfg,
    }),
  })
  if (!r.ok) {
    const msg = await r.text().catch(() => '')
    throw new Error(`SFX 引擎錯誤 ${r.status}（run-sfx 啟動了嗎？）${msg.slice(0, 120)}`)
  }
  const j = await r.json()
  onProgress?.(85)
  const item: LibraryItem = {
    id: crypto.randomUUID(),
    title: makeTitle(caption),
    finalCaption: caption,
    base,
    extra,
    lyrics: '',
    params: { ...params, seed: Number(j.seed) || params.seed },
    audioPath: j.raw_path,
    audioUrl: '/sfx' + j.audio_url,
    durationSec: Number(j.duration) || params.duration,
    type: 'sfx',
    createdAt: new Date().toISOString(),
  }
  await finalizeItem(item, autoTrim, trimThresh)
  onProgress?.(100)
  return item
}

// 共用生成管線：單首與佇列都呼叫這支。回傳 LibraryItem（不負責加入音檔庫，由呼叫端處理）。
export async function generateTrack(
  input: GenInput,
  onProgress?: (p: number) => void,
): Promise<LibraryItem> {
  if (input.type === 'sfx') return generateSfx(input, onProgress)

  const { base, extra, instrumental, lyrics, params, autoTrim, trimThresh } = input
  const caption = composeCaption(base, extra)
  if (!caption) throw new Error('請先輸入曲風描述')
  const finalLyrics = instrumental ? '[Instrumental]' : lyrics || '[Instrumental]'
  onProgress?.(4)

  const rel = await api.release({
    prompt: caption,
    lyrics: finalLyrics,
    model: params.model,
    audio_duration: params.duration,
    inference_steps: params.steps,
    guidance_scale: params.cfg,
    infer_method: params.inferMethod,
    use_random_seed: params.useRandomSeed,
    seed: params.useRandomSeed ? -1 : params.seed,
    audio_format: params.format,
    task_type: 'text2music',
    thinking: false,
    batch_size: 1,
  })
  const taskId: string | undefined =
    rel?.task_id ?? rel?.taskId ?? (Array.isArray(rel) ? rel[0]?.task_id : undefined)
  if (!taskId) throw new Error('未取得 task_id（檢查引擎回應格式）')

  for (let i = 0; i < 240; i++) {
    await delay(1500)
    const arr = await api.query(taskId)
    const outer = Array.isArray(arr) ? arr[0] : undefined
    const inner = outer ? parseResult(outer) : null
    if (!inner) continue
    if (typeof inner.progress === 'number') onProgress?.(Math.max(5, Math.round(inner.progress * 100)))

    const file = inner.file || ''
    const succeeded =
      inner.status === 1 || (inner.progress ?? 0) >= 1 || String(inner.stage).toLowerCase() === 'succeeded'
    if (succeeded && file) {
      const seedNum = inner.seed_value
        ? Number(String(inner.seed_value).split(',')[0]) || params.seed
        : params.seed
      const item: LibraryItem = {
        id: crypto.randomUUID(),
        title: makeTitle(caption),
        finalCaption: caption,
        base,
        extra,
        lyrics: finalLyrics,
        params: { ...params, seed: seedNum },
        audioPath: decodeURIComponent(file.split('path=')[1] || ''),
        audioUrl: api.audioUrl(file),
        durationSec: Number(inner.metas?.duration) || params.duration,
        type: 'bgm',
        createdAt: new Date().toISOString(),
      }
      await finalizeItem(item, autoTrim, trimThresh)
      onProgress?.(100)
      return item
    }
    if (String(inner.stage).toLowerCase().match(/fail|error/)) {
      throw new Error(inner.stage || '生成失敗')
    }
  }
  throw new Error('輪詢逾時（請確認引擎仍在運作）')
}
