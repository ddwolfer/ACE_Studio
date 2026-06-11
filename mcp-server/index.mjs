// ACE Studio MCP server（M5a）
// 讓 Claude Code / 任何 MCP 客戶端用自然語言驅動生成管線：
//   generate_bgm / generate_sfx / list_library / remove_item / studio_status
// 走「跟 UI 完全相同」的流程：引擎生成 → 裁頭尾靜音 → 落地 library/audio/ → 寫 library.json，
// 所以生完 app 作品庫（輪詢 updatedAt）會自動長出來。
// 依賴三個既有本機服務：engine :8001、SFX :8002、helper :8787（library 持久化必須）。
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import crypto from 'node:crypto'

const ENGINE = 'http://127.0.0.1:8001'
const SFX = 'http://127.0.0.1:8002'
const HELPER = 'http://127.0.0.1:8787'
const DEFAULT_MODEL = 'acestep-v15-turbo' // 2B：8GB 友善
const DEFAULT_TRIM_THRESH = 0.006

// ── HTTP helpers ────────────────────────────────────────────

async function jfetch(url, init = {}, timeoutMs = 15000) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const r = await fetch(url, { ...init, signal: ctl.signal })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(`${init.method || 'GET'} ${url} → HTTP ${r.status} ${JSON.stringify(j).slice(0, 200)}`)
    return j
  } finally {
    clearTimeout(t)
  }
}

const post = (url, body, timeoutMs) =>
  jfetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, timeoutMs)

// 引擎回應外層為 wrap_response({code,data,error})
function unwrap(j) {
  if (j && typeof j === 'object' && !Array.isArray(j) && 'data' in j) {
    if (j.error) throw new Error(String(j.error))
    return j.data
  }
  return j
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// ── 共用：標題、入庫管線（對齊 frontend/src/lib/generate.ts） ──

function makeTitle(caption) {
  const head = caption.split(',')[0].trim().slice(0, 24).replace(/\s+/g, '_')
  const t = new Date()
  return `${head || 'track'}_${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}`
}

/** 裁靜音（可選）→ 複製進 library/audio/ → 寫進 library.json。helper 沒開會 throw。 */
async function finalize(item, { trim = true, trimThresh = DEFAULT_TRIM_THRESH } = {}) {
  if (trim) {
    try {
      const j = await post(`${HELPER}/trim-silence`, { path: item.audioPath, thresh: trimThresh }, 130000)
      if (j?.ok && j.out) item.audioPath = j.out
    } catch {
      /* 裁切失敗不致命，用原檔入庫 */
    }
  }
  const imp = await post(`${HELPER}/library/import-audio`, { path: item.audioPath, id: item.id })
  if (!imp?.ok) throw new Error('入庫失敗（run-local :8787 開了嗎？）：' + (imp?.error || ''))
  item.audioPath = imp.path
  item.audioUrl = imp.url
  const add = await post(`${HELPER}/library/add-item`, { item })
  if (!add?.ok) throw new Error('寫入 library.json 失敗：' + (add?.error || ''))
  return item
}

function itemSummary(it) {
  return {
    id: it.id,
    title: it.title,
    type: it.type,
    durationSec: it.durationSec,
    prompt: it.finalCaption,
    seed: it.params?.seed,
    file: it.audioPath,
    playUrl: it.audioUrl,
  }
}

const text = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] })

// ── MCP server ──────────────────────────────────────────────

const server = new McpServer({ name: 'ace-studio', version: '0.1.0' })

server.tool(
  'studio_status',
  '檢查 ACE Studio 三個本機服務（BGM 引擎 :8001、SFX 引擎 :8002、helper :8787）的健康狀態與已載入模型。生成前可先呼叫判斷服務是否就緒。',
  {},
  async () => {
    const out = { engine: null, sfx: null, helper: null, hint: '' }
    try {
      const h = unwrap(await jfetch(`${ENGINE}/health`, {}, 5000))
      out.engine = { ok: true, models_initialized: !!h?.models_initialized, loaded_model: h?.loaded_model || null }
    } catch {
      out.engine = { ok: false }
    }
    try {
      const h = await jfetch(`${SFX}/health`, {}, 5000)
      out.sfx = { ok: !!h?.ok, model_loaded: !!h?.model_loaded, device: h?.device }
    } catch {
      out.sfx = { ok: false }
    }
    try {
      const h = await jfetch(`${HELPER}/health`, {}, 5000)
      out.helper = { ok: !!h?.ok }
    } catch {
      out.helper = { ok: false }
    }
    if (!out.engine.ok || !out.sfx.ok || !out.helper.ok)
      out.hint = '有服務沒開：在專案目錄執行 start.cmd（或個別 run-engine / run-sfx / run-local .ps1）'
    return text(out)
  },
)

server.tool(
  'generate_bgm',
  '用 ACE-Step 生成一段 BGM/配樂（5–120 秒），自動裁頭尾靜音並存入作品庫。prompt 用英文、Suno 風格越具體越好（配器、演奏法、情緒、場景、BPM）。生成約 1–3 分鐘，請耐心等待；多首請逐一呼叫（引擎單併發）。',
  {
    prompt: z.string().min(1).describe('英文曲風描述，例：epic orchestral battle music, pounding war drums, ..., 140 BPM'),
    duration: z.number().min(5).max(120).default(60).describe('長度（秒），5–120'),
    lyrics: z.string().optional().describe('歌詞；不給 = 純音樂 [Instrumental]'),
    seed: z.number().int().optional().describe('固定種子可重現；不給 = 隨機'),
    trim: z.boolean().default(true).describe('是否自動裁頭尾靜音（loop-ready）'),
  },
  async ({ prompt, duration, lyrics, seed, trim }) => {
    // 引擎沒初始化就自動 init（約 30 秒）
    let h
    try {
      h = unwrap(await jfetch(`${ENGINE}/health`, {}, 5000))
    } catch {
      throw new Error('BGM 引擎 :8001 沒開（執行 start.cmd 或 run-engine.ps1）')
    }
    const model = h?.loaded_model || DEFAULT_MODEL
    if (!h?.models_initialized) {
      await post(`${ENGINE}/v1/init`, { model, init_llm: false }, 600000)
    }
    // 8GB 卡策略：先請 SFX 引擎釋放模型（失敗忽略）
    await post(`${SFX}/release`, {}, 10000).catch(() => {})

    const useRandomSeed = seed === undefined
    const rel = unwrap(
      await post(
        `${ENGINE}/release_task`,
        {
          prompt,
          lyrics: lyrics || '[Instrumental]',
          model,
          audio_duration: duration,
          inference_steps: 8, // turbo 建議
          guidance_scale: 7,
          infer_method: 'ode',
          use_random_seed: useRandomSeed,
          seed: useRandomSeed ? -1 : seed,
          audio_format: 'wav',
          task_type: 'text2music',
          thinking: false,
          batch_size: 1,
        },
        30000,
      ),
    )
    const taskId = rel?.task_id ?? rel?.taskId ?? (Array.isArray(rel) ? rel[0]?.task_id : undefined)
    if (!taskId) throw new Error('未取得 task_id（檢查引擎回應格式）')

    for (let i = 0; i < 360; i++) {
      await delay(1500)
      const arr = unwrap(await post(`${ENGINE}/query_result`, { task_id_list: JSON.stringify([taskId]) }, 15000))
      const outer = Array.isArray(arr) ? arr[0] : undefined
      let inner = null
      try {
        const p = JSON.parse(outer?.result ?? 'null')
        inner = Array.isArray(p) ? p[0] : p
      } catch {
        /* result 還不是 JSON → 繼續等 */
      }
      if (!inner) continue
      const file = inner.file || ''
      const ok = inner.status === 1 || (inner.progress ?? 0) >= 1 || String(inner.stage).toLowerCase() === 'succeeded'
      if (ok && file) {
        const seedNum = inner.seed_value ? Number(String(inner.seed_value).split(',')[0]) || (seed ?? -1) : (seed ?? -1)
        const item = {
          id: crypto.randomUUID(),
          title: makeTitle(prompt),
          finalCaption: prompt,
          base: prompt,
          extra: '',
          lyrics: lyrics || '[Instrumental]',
          params: { model, duration, steps: 8, cfg: 7, inferMethod: 'ode', seed: seedNum, useRandomSeed, format: 'wav' },
          audioPath: decodeURIComponent(file.split('path=')[1] || ''),
          audioUrl: '/api' + file,
          durationSec: Number(inner.metas?.duration) || duration,
          type: 'bgm',
          createdAt: new Date().toISOString(),
        }
        await finalize(item, { trim })
        return text({ ok: true, item: itemSummary(item), note: 'app 作品庫 5 秒內會自動出現' })
      }
      if (String(inner.stage).toLowerCase().match(/fail|error/)) throw new Error('生成失敗：' + (inner.stage || ''))
    }
    throw new Error('輪詢逾時（9 分鐘）；引擎可能卡住，檢查 run-engine 視窗')
  },
)

server.tool(
  'generate_sfx',
  '用 Stable Audio Open 生成一個短音效（0.5–8 秒），自動裁靜音並存入作品庫。prompt 用英文描述「聲音事件」而非音樂風格，加材質/衰減/錄音特徵更可控，例：retro game coin pickup, bright metallic ding, fast decay, no reverb。第一次呼叫會載入模型（多等 10–30 秒）。',
  {
    prompt: z.string().min(1).describe('英文聲音事件描述'),
    duration: z.number().min(0.5).max(8).default(1.5).describe('長度（秒），0.5–8'),
    seed: z.number().int().optional().describe('固定種子可重現；不給 = 隨機'),
    trim: z.boolean().default(true).describe('是否自動裁頭尾靜音'),
  },
  async ({ prompt, duration, seed, trim }) => {
    const j = await post(
      `${SFX}/generate`,
      { prompt, duration, seed: seed ?? -1, steps: 100, cfg: 7.0 },
      300000, // 第一次含載模型
    ).catch((e) => {
      throw new Error(`SFX 引擎錯誤（run-sfx :8002 開了嗎？）：${e.message}`)
    })
    const item = {
      id: crypto.randomUUID(),
      title: makeTitle(prompt),
      finalCaption: prompt,
      base: prompt,
      extra: '',
      lyrics: '',
      params: {
        model: 'stable-audio-open-1.0',
        duration,
        steps: 100,
        cfg: 7,
        inferMethod: 'ode',
        seed: Number(j.seed) || seed || -1,
        useRandomSeed: seed === undefined,
        format: 'wav',
      },
      audioPath: j.raw_path,
      audioUrl: '/sfx' + j.audio_url,
      durationSec: Number(j.duration) || duration,
      type: 'sfx',
      createdAt: new Date().toISOString(),
    }
    await finalize(item, { trim })
    return text({ ok: true, item: itemSummary(item), note: 'app 作品庫 5 秒內會自動出現' })
  },
)

server.tool(
  'list_library',
  '列出作品庫的所有音檔（id、標題、類型、長度、prompt、檔案路徑）。要改寫某個作品的 prompt 重生、或刪除時，先用這個拿 id 和舊 prompt。',
  { type: z.enum(['bgm', 'sfx']).optional().describe('只列某類型；不給 = 全部') },
  async ({ type }) => {
    const j = await jfetch(`${HELPER}/library`, {}, 10000).catch(() => {
      throw new Error('helper :8787 沒開（執行 start.cmd 或 run-local.ps1）')
    })
    const items = (j?.items || []).filter((it) => !type || (type === 'sfx' ? it.type === 'sfx' : it.type !== 'sfx'))
    return text({ count: items.length, dir: j?.dir, items: items.map(itemSummary) })
  },
)

server.tool(
  'remove_item',
  '從作品庫移除一個音檔（連磁碟上的音檔一起刪）。先用 list_library 確認 id。',
  { id: z.string().min(1).describe('作品 id') },
  async ({ id }) => {
    const j = await post(`${HELPER}/library/remove-item`, { id })
    if (!j?.ok) throw new Error('移除失敗：' + (j?.error || ''))
    return text({ ok: true, removed: !!j.removed, id })
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
