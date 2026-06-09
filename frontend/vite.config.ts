import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 前端跑 5173；/api 反向代理到 ACE-Step 引擎 (acestep-api :8001)。
// rewrite 把 /api 前綴拿掉：/api/v1/models → /v1/models
// 同時順便解掉 CORS 與 <audio>/wavesurfer 取檔的問題（引擎本機不設 api key）。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
