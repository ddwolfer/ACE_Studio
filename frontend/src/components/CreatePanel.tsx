import { useState } from 'react'
import PresetSidebar from './PresetSidebar'
import TemplatesSection from './TemplatesSection'
import SingleGen from './SingleGen'
import BatchGen from './BatchGen'

export default function CreatePanel() {
  const [mode, setMode] = useState<'single' | 'batch'>('single')

  return (
    <aside
      className="fade-up flex w-[360px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-edge bg-panel/50 p-5"
      style={{ animationDelay: '0.05s' }}
    >
      <div className="flex gap-1 rounded-lg bg-base/50 p-1">
        {(['single', 'batch'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              mode === m ? 'bg-input text-txt' : 'text-txt-sec hover:text-txt'
            }`}
          >
            {m === 'single' ? '單首生成' : '批次生成'}
          </button>
        ))}
      </div>

      {mode === 'single' ? (
        <>
          <PresetSidebar />
          <TemplatesSection />
          <SingleGen />
        </>
      ) : (
        <BatchGen />
      )}
    </aside>
  )
}
