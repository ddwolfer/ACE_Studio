// ACE Studio 本機小幫手（純 Node，零相依）
// 提供瀏覽器做不到的本機操作：
//   POST /open-folder          在檔案總管開啟音檔所在資料夾（給檔案或資料夾路徑皆可）
//   POST /trim-silence         裁掉頭尾靜音 → 產生 loop-ready 的 _loop.wav（用引擎 venv 的 python）
//   GET  /library              讀取 library/library.json（M3：音檔庫落地磁碟）
//   POST /library              覆寫 library/library.json
//   POST /library/add-item     插入單筆（伺服器端原子讀寫；MCP 與前端共用，避免整份覆寫競態）
//   POST /library/remove-item  移除單筆 + 連帶刪其音檔
//   POST /library/import-audio 把生成的音檔複製進 library/audio/（脫離引擎暫存資料夾）
//   POST /library/delete-audio 刪除 library/audio/ 內指定音檔
//   GET  /audio/<file>         播放 library/audio/ 內的音檔（支援 Range）
// 啟動：node server/index.mjs（或 run-local.ps1 / run-local.sh）
import http from 'node:http'
import { exec, execFile } from 'node:child_process'
import {
  existsSync,
  statSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  createReadStream,
} from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const PORT = 8787
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const LIB_DIR = path.join(ROOT, 'library')
const AUDIO_DIR = path.join(LIB_DIR, 'audio')
const LIB_JSON = path.join(LIB_DIR, 'library.json')

const MIME = { '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.ogg': 'audio/ogg' }

function ensureLibDirs() {
  mkdirSync(AUDIO_DIR, { recursive: true })
}

function readLib() {
  ensureLibDirs()
  try {
    const j = JSON.parse(readFileSync(LIB_JSON, 'utf8'))
    return { items: j.items || [], updatedAt: j.updatedAt || '' }
  } catch {
    return { items: [], updatedAt: '' } // 尚無 library.json → 空庫
  }
}

function writeLib(items) {
  ensureLibDirs()
  writeFileSync(LIB_JSON, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), items }, null, 2))
}

function enginePython() {
  return os.platform() === 'win32'
    ? path.join(ROOT, 'engine', '.venv', 'Scripts', 'python.exe')
    : path.join(ROOT, 'engine', '.venv', 'bin', 'python')
}

function openInFileManager(p) {
  if (!p || !existsSync(p)) throw new Error('找不到檔案：' + p)
  const isDir = statSync(p).isDirectory()
  const plat = os.platform()
  if (plat === 'win32') exec(isDir ? `explorer "${p}"` : `explorer /select,"${p}"`)
  else if (plat === 'darwin') exec(isDir ? `open "${p}"` : `open -R "${p}"`)
  else exec(`xdg-open "${isDir ? p : path.dirname(p)}"`)
}

// 防 path traversal：library/audio 內只允許單純檔名
function safeAudioName(name) {
  return !!name && !name.includes('/') && !name.includes('\\') && !name.includes('..')
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
    const { path: p, thresh } = await readBody(req)
    if (!p || !existsSync(p)) return send(res, 400, { ok: false, error: '找不到檔案：' + p })
    const script = path.join(__dirname, 'trim_silence.py')
    const args = [script, p]
    if (typeof thresh === 'number' && thresh > 0 && thresh < 0.5) args.push(String(thresh))
    execFile(enginePython(), args, { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) return send(res, 500, { ok: false, error: String(stderr || err.message) })
      const out = String(stdout).trim().split(/\r?\n/).filter(Boolean).pop()
      if (!out || !existsSync(out)) return send(res, 500, { ok: false, error: 'trim 失敗' })
      send(res, 200, { ok: true, out })
    })
    return
  }

  // ── M3：音檔庫落地 ──────────────────────────────────────────

  if (req.method === 'GET' && req.url === '/library') {
    const { items, updatedAt } = readLib()
    return send(res, 200, { ok: true, items, dir: LIB_DIR, updatedAt })
  }

  if (req.method === 'POST' && req.url === '/library') {
    const { items } = await readBody(req)
    if (!Array.isArray(items)) return send(res, 400, { ok: false, error: 'items 必須是陣列' })
    try {
      writeLib(items)
      return send(res, 200, { ok: true })
    } catch (e) {
      return send(res, 500, { ok: false, error: String((e && e.message) || e) })
    }
  }

  // 單筆插入/移除：伺服器端讀最新檔再寫，MCP server 與前端都走這裡可避免互相蓋寫
  if (req.method === 'POST' && req.url === '/library/add-item') {
    const { item } = await readBody(req)
    if (!item || typeof item !== 'object' || !item.id)
      return send(res, 400, { ok: false, error: 'item 必須是含 id 的物件' })
    try {
      const { items } = readLib()
      writeLib([item, ...items.filter((i) => i.id !== item.id)])
      return send(res, 200, { ok: true })
    } catch (e) {
      return send(res, 500, { ok: false, error: String((e && e.message) || e) })
    }
  }

  if (req.method === 'POST' && req.url === '/library/remove-item') {
    const { id } = await readBody(req)
    if (!id) return send(res, 400, { ok: false, error: '缺 id' })
    try {
      const { items } = readLib()
      const it = items.find((i) => i.id === id)
      writeLib(items.filter((i) => i.id !== id))
      // 已落地的音檔一併刪除（只動 library/audio/ 內、以該 id 命名的檔案）
      if (it && it.audioPath) {
        const name = String(it.audioPath).split(/[\\/]/).pop() || ''
        if (name.startsWith(id) && safeAudioName(name)) {
          try {
            unlinkSync(path.join(AUDIO_DIR, name))
          } catch {
            /* 占用等 → 忽略 */
          }
        }
      }
      return send(res, 200, { ok: true, removed: !!it })
    } catch (e) {
      return send(res, 500, { ok: false, error: String((e && e.message) || e) })
    }
  }

  if (req.method === 'POST' && req.url === '/library/import-audio') {
    const { path: src, id } = await readBody(req)
    if (!src || !existsSync(src)) return send(res, 400, { ok: false, error: '找不到來源音檔：' + src })
    if (!id || !/^[\w-]+$/.test(id)) return send(res, 400, { ok: false, error: 'id 不合法' })
    ensureLibDirs()
    const ext = (path.extname(src) || '.wav').toLowerCase()
    const name = id + ext
    try {
      copyFileSync(src, path.join(AUDIO_DIR, name))
      return send(res, 200, {
        ok: true,
        path: path.join(AUDIO_DIR, name),
        url: `http://127.0.0.1:${PORT}/audio/${name}`,
      })
    } catch (e) {
      return send(res, 500, { ok: false, error: String((e && e.message) || e) })
    }
  }

  if (req.method === 'POST' && req.url === '/library/delete-audio') {
    const { filename } = await readBody(req)
    if (!safeAudioName(filename)) return send(res, 400, { ok: false, error: '檔名不合法' })
    const p = path.join(AUDIO_DIR, filename)
    try {
      if (existsSync(p)) unlinkSync(p)
    } catch {
      /* 檔案被占用等 → 忽略，清單仍會移除 */
    }
    return send(res, 200, { ok: true })
  }

  if (req.method === 'GET' && req.url && req.url.startsWith('/audio/')) {
    const name = decodeURIComponent(req.url.slice('/audio/'.length).split('?')[0])
    if (!safeAudioName(name)) {
      res.writeHead(400)
      return res.end()
    }
    const p = path.join(AUDIO_DIR, name)
    if (!existsSync(p)) {
      res.writeHead(404)
      return res.end()
    }
    const size = statSync(p).size
    const type = MIME[path.extname(p).toLowerCase()] || 'application/octet-stream'
    const range = req.headers.range
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range)
      let start = m && m[1] ? parseInt(m[1], 10) : 0
      let end = m && m[2] ? parseInt(m[2], 10) : size - 1
      if (start >= size) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` })
        return res.end()
      }
      end = Math.min(end, size - 1)
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
      })
      return createReadStream(p, { start, end }).pipe(res)
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' })
    return createReadStream(p).pipe(res)
  }

  res.writeHead(404)
  res.end()
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[ACE Studio local] http://127.0.0.1:${PORT}  (open-folder + trim-silence + library ready)`)
})
