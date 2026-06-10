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
  const hydrateLibrary = useLibrary((s) => s.hydrate)
  useEffect(() => {
    loadModels()
    void hydrateLibrary() // M3：從磁碟 library.json 載入（沒開 run-local 則維持 localStorage）
  }, [loadModels, hydrateLibrary])

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
