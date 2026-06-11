// MCP server 冒煙測試：spawn index.mjs，走一輪協定 + 真實生成一個 SFX。
// 用法：node mcp-server/smoke-test.mjs [--full]（--full 也測 generate_sfx，需 :8002/:8787 在線）
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const full = process.argv.includes('--full')
const child = spawn(process.execPath, [path.join(__dirname, 'index.mjs')], { stdio: ['pipe', 'pipe', 'inherit'] })

let buf = ''
const pending = new Map()
child.stdout.on('data', (c) => {
  buf += c
  let i
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim()
    buf = buf.slice(i + 1)
    if (!line) continue
    const msg = JSON.parse(line)
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
})

let nextId = 1
function rpc(method, params, timeoutMs = 10000) {
  const id = nextId++
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout: ${method}`)), timeoutMs)
    pending.set(id, (m) => {
      clearTimeout(t)
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)
    })
  })
}

try {
  const init = await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'smoke-test', version: '0' },
  })
  console.log('[1] initialize OK:', init.serverInfo.name, init.serverInfo.version)
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')

  const tools = await rpc('tools/list', {})
  console.log('[2] tools:', tools.tools.map((t) => t.name).join(', '))

  const status = await rpc('tools/call', { name: 'studio_status', arguments: {} })
  console.log('[3] studio_status:', status.content[0].text.replace(/\s+/g, ' '))

  if (full) {
    console.log('[4] generate_sfx（真實生成，約 10–60 秒）...')
    const gen = await rpc(
      'tools/call',
      { name: 'generate_sfx', arguments: { prompt: 'ui button click, single short soft digital beep, clean tick', duration: 0.5 } },
      300000,
    )
    console.log('[4] generate_sfx:', gen.content[0].text.replace(/\s+/g, ' '))
    const lib = await rpc('tools/call', { name: 'list_library', arguments: { type: 'sfx' } })
    const parsed = JSON.parse(lib.content[0].text)
    console.log('[5] list_library: count =', parsed.count)
  }
  console.log('SMOKE TEST PASS')
} catch (e) {
  console.error('SMOKE TEST FAIL:', e.message)
  process.exitCode = 1
} finally {
  child.kill()
}
