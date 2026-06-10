import PresetSidebar from './PresetSidebar'
import TemplatesSection from './TemplatesSection'
import SingleGen from './SingleGen'
import QueuePanel from './QueuePanel'

export default function CreatePanel() {
  return (
    <aside
      className="fade-up flex w-[360px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-edge bg-panel/50 p-5"
      style={{ animationDelay: '0.05s' }}
    >
      <PresetSidebar />
      <TemplatesSection />
      <SingleGen />
      <QueuePanel />
    </aside>
  )
}
