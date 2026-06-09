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
    <div className="relative z-10 flex h-full flex-col font-ui text-txt">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        {/* 左：精簡建立面板 */}
        <aside
          className="fade-up flex w-[360px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-edge bg-panel/50 p-5"
          style={{ animationDelay: '0.05s' }}
        >
          <PresetSidebar />
          <SingleGen />
        </aside>
        {/* 中：音檔庫工作區（主角） */}
        <Library />
      </div>
      <TransportBar />
    </div>
  )
}
