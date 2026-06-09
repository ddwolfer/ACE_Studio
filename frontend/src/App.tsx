import { useEffect } from 'react'
import { useService } from './stores/serviceStore'
import TopBar from './components/TopBar'
import PresetSidebar from './components/PresetSidebar'
import SingleGen from './components/SingleGen'
import Library from './components/Library'
import TransportBar from './components/TransportBar'

export default function App() {
  const loadModels = useService((s) => s.loadModels)
  useEffect(() => {
    loadModels()
  }, [loadModels])

  return (
    <div className="flex h-full flex-col bg-base font-ui text-txt">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <PresetSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <SingleGen />
        </main>
        <Library />
      </div>
      <TransportBar />
    </div>
  )
}
