// ACE-Step 引擎 API client（經 Vite proxy /api → :8001）
// 端點與欄位對應見 docs/IMPLEMENTATION-SPEC.md §3、§5
const BASE = '/api'

export interface ReleaseReq {
  prompt: string // = caption / tags
  lyrics: string
  model: string
  audio_duration: number
  inference_steps: number
  guidance_scale: number
  infer_method: 'ode' | 'sde'
  use_random_seed: boolean
  seed: number
  audio_format: string
  task_type: string
  thinking: boolean
  batch_size: number
}

// /query_result 回傳 data = QueryOuter[]；其中 result 是 JSON 字串，
// parse 後取 [0] 得 QueryInner（實測格式，見 docs/IMPLEMENTATION-SPEC §3）
export interface QueryOuter {
  task_id: string
  result: string
  status: number
  progress_text?: string
}
export interface QueryInner {
  file?: string // 形如 /v1/audio?path=<urlencoded fs path>（可直接前綴 /api 播放）
  wave?: string
  status?: number // 0=running, 1=succeeded
  progress?: number // 0..1
  stage?: string
  seed_value?: string
  metas?: Record<string, any>
  prompt?: string
  lyrics?: string
}

export function parseResult(item: QueryOuter): QueryInner | null {
  try {
    const arr = JSON.parse(item.result)
    return Array.isArray(arr) ? arr[0] : arr
  } catch {
    return null
  }
}

// 引擎回應外層為 wrap_response({code,data,error})；解開取 data。
function unwrap(j: any): any {
  if (j && typeof j === 'object' && !Array.isArray(j) && 'data' in j) {
    if ('error' in j && j.error) throw new Error(String(j.error))
    return j.data
  }
  return j
}

async function post(path: string, body: unknown): Promise<any> {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}`)
  return unwrap(await r.json())
}

async function getJson(path: string): Promise<any> {
  const r = await fetch(BASE + path)
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`)
  return unwrap(await r.json())
}

export const api = {
  health: () => getJson('/health'),
  models: () => getJson('/v1/models'),
  stats: () => getJson('/v1/stats'),
  init: (model: string, initLlm = false) => post('/v1/init', { model, init_llm: initLlm }),
  release: (p: ReleaseReq): Promise<any> => post('/release_task', p),
  query: (taskId: string): Promise<QueryOuter[]> =>
    post('/query_result', { task_id_list: JSON.stringify([taskId]) }),
  // inner.file 已是 /v1/audio?path=...，前綴 /api 即可播放
  audioUrl: (file: string) => `${BASE}${file}`,
}
