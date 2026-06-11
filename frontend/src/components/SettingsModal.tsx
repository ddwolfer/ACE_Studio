import { createPortal } from 'react-dom'
import { X, FolderOpen, HardDrive, Sliders, Scissors } from 'lucide-react'
import { useGen } from '../stores/genStore'
import { useLibrary } from '../stores/libraryStore'
import { local } from '../lib/localHelper'

// M3 設定頁：進階生成參數 + 自動裁切閾值 + 資料儲存狀態。
// 這些值存在 genStore（localStorage 持久化），不需要存檔按鈕——改了即生效。
// portal 到 body：TopBar 的 backdrop-blur 會讓 fixed 改以頂欄為定位基準，modal 會被切掉。
export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const g = useGen()
  const diskMode = useLibrary((s) => s.diskMode)
  const dir = useLibrary((s) => s.dir)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-[460px] flex-col overflow-hidden rounded-xl border border-edge bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-edge px-5 py-3.5">
          <div className="font-display text-sm font-bold uppercase tracking-wider text-txt">設定</div>
          <button onClick={onClose} className="text-txt-sec transition hover:text-txt">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto p-5">
          {/* 生成參數 */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-txt-sec">
              <Sliders size={12} /> 進階生成參數
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-txt-sec">推論步數（越多越細但越慢；turbo 建議 8）</span>
                  <span className="font-mono text-primary">{g.params.steps}</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={50}
                  step={1}
                  value={g.params.steps}
                  onChange={(e) => g.setParam('steps', Number(e.target.value))}
                  className="range w-full"
                />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-txt-sec">Guidance（越高越貼 prompt、但可能失真）</span>
                  <span className="font-mono text-primary">{g.params.cfg}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={0.5}
                  value={g.params.cfg}
                  onChange={(e) => g.setParam('cfg', Number(e.target.value))}
                  className="range w-full"
                />
              </div>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1.5 text-xs text-txt-sec">
                  取樣方法
                  <select
                    value={g.params.inferMethod}
                    onChange={(e) => g.setParam('inferMethod', e.target.value as 'ode' | 'sde')}
                    className="rounded-md border border-edge bg-input px-2.5 py-2 font-mono text-sm text-txt outline-none focus:border-primary"
                  >
                    <option value="ode">ode（穩定，預設）</option>
                    <option value="sde">sde（變化較多）</option>
                  </select>
                </label>
                <label className="flex flex-1 flex-col gap-1.5 text-xs text-txt-sec">
                  輸出格式
                  <select
                    value={g.params.format}
                    onChange={(e) => g.setParam('format', e.target.value as 'wav' | 'mp3' | 'flac')}
                    className="rounded-md border border-edge bg-input px-2.5 py-2 font-mono text-sm text-txt outline-none focus:border-primary"
                  >
                    <option value="wav">wav（無損，遊戲引擎直用）</option>
                    <option value="mp3">mp3（小檔）</option>
                    <option value="flac">flac（無損壓縮）</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={g.params.useRandomSeed}
                    onChange={(e) => g.setParam('useRandomSeed', e.target.checked)}
                    className="accent-primary"
                  />
                  隨機種子
                </label>
                {!g.params.useRandomSeed && (
                  <input
                    type="number"
                    value={g.params.seed}
                    onChange={(e) => g.setParam('seed', Number(e.target.value))}
                    className="w-32 rounded-md border border-edge bg-input px-2.5 py-1.5 font-mono text-sm text-txt outline-none focus:border-primary"
                    title="固定種子：同 prompt + 同種子 → 可重現結果"
                  />
                )}
              </div>
            </div>
          </section>

          {/* 自動裁切 */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-txt-sec">
              <Scissors size={12} /> 自動裁切（loop-ready）
            </div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-txt-sec">靜音判定閾值（越大裁越多，淡出長的曲子可調低）</span>
              <span className="font-mono text-primary">{g.trimThresh.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min={0.001}
              max={0.02}
              step={0.001}
              value={g.trimThresh}
              onChange={(e) => g.setTrimThresh(Number(e.target.value))}
              className="range w-full"
            />
          </section>

          {/* 資料儲存 */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-txt-sec">
              <HardDrive size={12} /> 資料儲存
            </div>
            {diskMode ? (
              <div className="flex flex-col gap-2.5 rounded-md border border-edge bg-base p-3 text-xs">
                <div>
                  <span className="text-primary">已落地磁碟</span>
                  <span className="text-txt-dim">：音檔庫存於 library.json，音檔複製於 library/audio/</span>
                </div>
                <div className="break-all font-mono text-txt-dim">{dir}</div>
                <button
                  onClick={() => void local.openFolder(dir)}
                  className="flex w-fit items-center gap-1.5 rounded-md border border-edge px-2.5 py-1.5 text-txt-sec transition hover:text-txt"
                >
                  <FolderOpen size={13} /> 打開音檔庫資料夾
                </button>
              </div>
            ) : (
              <div className="rounded-md border border-edge bg-base p-3 text-xs text-txt-dim">
                目前存在瀏覽器 localStorage（清快取會消失）。啟動 run-local 後重新整理，會自動搬移落地到磁碟。
              </div>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
