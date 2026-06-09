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

export interface QueryResultItem {
  status?: string
  first_audio_path?: string
  audio_paths?: string[]
  raw_audio_paths?: string[]
  seed_value?: string
  status_message?: string
  metas?: Record<string, unknown>
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
  models: () => getJson('/v1/models'),
  stats: () => getJson('/v1/stats'),
  init: (model: string, initLlm = false) => post('/v1/init', { model, init_llm: initLlm }),
  release: (p: ReleaseReq): Promise<any> => post('/release_task', p),
  query: (taskId: string): Promise<QueryResultItem[]> =>
    post('/query_result', { task_id_list: JSON.stringify([taskId]) }),
  audioUrl: (rawPath: string) => `${BASE}/v1/audio?path=${encodeURIComponent(rawPath)}`,
}
