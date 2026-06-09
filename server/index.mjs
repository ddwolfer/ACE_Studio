// ACE Studio 本機小幫手（純 Node，零相依）
// 用途：讓前端能做瀏覽器做不到的本機操作 —— 目前：在檔案總管開啟音檔所在資料夾。
// 之後可擴充：library.json 落地、Claude 代理等。
// 啟動：node server/index.mjs  （或 run-local.ps1 / run-local.sh）
import http from 'node:http'
import { exec } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const PORT = 8787

function openInFileManager(p) {
  if (!p || !existsSync(p)) throw new Error('找不到檔案：' + p)
  const plat = os.platform()
  if (plat === 'win32') {
    // explorer 對成功也會回非 0 結束碼，忽略即可
    exec(`explorer /select,"${p}"`)
  } else if (plat === 'darwin') {
    exec(`open -R "${p}"`)
  } else {
    exec(`xdg-open "${path.dirname(p)}"`)
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ ok: true, service: 'ace-studio-local' }))
  }
  if (req.method === 'POST' && req.url === '/open-folder') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      try {
        const { path: p } = JSON.parse(body || '{}')
        openInFileManager(p)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: String((e && e.message) || e) }))
      }
    })
    return
  }
  res.writeHead(404)
  res.end()
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[ACE Studio local] http://127.0.0.1:${PORT}  (open-folder ready)`)
})
