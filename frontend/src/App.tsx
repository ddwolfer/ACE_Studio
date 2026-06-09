import { useEffect } from 'react'
import { useService } from './stores/serviceStore'
import TopBar from './components/TopBar'
import CreatePanel from './components/CreatePanel'
import Library from './components/Library'
import TransportBar from './components/TransportBar'

export default function App() {
  const loadModels = useService((s) => s.loadModels)
  useEffect(() => {
    loadModels()
  }, [loadModels])

  return (
    <div className="relative z-10 flex h-full flex-col font-ui text-txt">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <CreatePanel />
        <Library />
      </div>
      <TransportBar />
    </div>
  )
}
