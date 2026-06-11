import { useEffect } from 'react'
import { useService } from './stores/serviceStore'
import { useLibrary } from './stores/libraryStore'
import TopBar from './components/TopBar'
import CreatePanel from './components/CreatePanel'
import Library from './components/Library'
import QueueDrawer from './components/QueueDrawer'
import TransportBar from './components/TransportBar'

export default function App() {
  const loadModels = useService((s) => s.loadModels)
  const checkSfx = useService((s) => s.checkSfx)
  const hydrateLibrary = useLibrary((s) => s.hydrate)
  useEffect(() => {
    loadModels()
    void checkSfx() // M4：偵測 SFX 引擎（:8002）是否在線
    void hydrateLibrary() // M3：從磁碟 library.json 載入（沒開 run-local 則維持 localStorage）
  }, [loadModels, checkSfx, hydrateLibrary])

  // M5：輪詢磁碟 updatedAt——MCP（Claude Code）生成入庫後，app 不用手動重新整理
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void useLibrary.getState().refresh()
    }, 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative z-10 flex h-full flex-col font-ui text-txt">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <CreatePanel />
        <Library />
        <QueueDrawer />
      </div>
      <TransportBar />
    </div>
  )
}
