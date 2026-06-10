import PresetSidebar from './PresetSidebar'
import TemplatesSection from './TemplatesSection'
import SingleGen from './SingleGen'
import QueuePanel from './QueuePanel'

export default function CreatePanel() {
  return (
    <aside
      className="fade-up flex w-[360px] shrink-0 flex-col border-r border-edge bg-panel/50"
      style={{ animationDelay: '0.05s' }}
    >
      {/* 表單：可捲動 */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
        <PresetSidebar />
        <TemplatesSection />
        <SingleGen />
      </div>
      {/* 佇列：固定釘在底部，永遠可見 */}
      <QueuePanel />
    </aside>
  )
}
