// ACE Studio 本機小幫手（純 Node，零相依）
// 提供瀏覽器做不到的本機操作：
//   POST /open-folder   在檔案總管開啟音檔所在資料夾
//   POST /trim-silence  裁掉頭尾靜音 → 產生 loop-ready 的 _loop.wav（用引擎 venv 的 python）
// 啟動：node server/index.mjs（或 run-local.ps1 / run-local.sh）
import http from 'node:http'
import { exec, execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const PORT = 8787
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function enginePython() {
  return os.platform() === 'win32'
    ? path.join(ROOT, 'engine', '.venv', 'Scripts', 'python.exe')
    : path.join(ROOT, 'engine', '.venv', 'bin', 'python')
}

function openInFileManager(p) {
  if (!p || !existsSync(p)) throw new Error('找不到檔案：' + p)
  const plat = os.platform()
  if (plat === 'win32') exec(`explorer /select,"${p}"`)
  else if (plat === 'darwin') exec(`open -R "${p}"`)
  else exec(`xdg-open "${path.dirname(p)}"`)
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(obj))
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => {
      try {
        resolve(JSON.parse(b || '{}'))
      } catch {
        resolve({})
      }
    })
  })
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { ok: true, service: 'ace-studio-local' })
  }

  if (req.method === 'POST' && req.url === '/open-folder') {
    const { path: p } = await readBody(req)
    try {
      openInFileManager(p)
      return send(res, 200, { ok: true })
    } catch (e) {
      return send(res, 400, { ok: false, error: String((e && e.message) || e) })
    }
  }

  if (req.method === 'POST' && req.url === '/trim-silence') {
    const { path: p } = await readBody(req)
    if (!p || !existsSync(p)) return send(res, 400, { ok: false, error: '找不到檔案：' + p })
    const script = path.join(__dirname, 'trim_silence.py')
    execFile(enginePython(), [script, p], { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) return send(res, 500, { ok: false, error: String(stderr || err.message) })
      const out = String(stdout).trim().split(/\r?\n/).filter(Boolean).pop()
      if (!out || !existsSync(out)) return send(res, 500, { ok: false, error: 'trim 失敗' })
      send(res, 200, { ok: true, out })
    })
    return
  }

  res.writeHead(404)
  res.end()
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[ACE Studio local] http://127.0.0.1:${PORT}  (open-folder + trim-silence ready)`)
})
