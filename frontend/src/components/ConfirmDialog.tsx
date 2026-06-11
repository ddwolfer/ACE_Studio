import { createPortal } from 'react-dom'
import { TriangleAlert } from 'lucide-react'

// 輕量確認視窗（portal 到 body，同 SettingsModal 的理由）。
// 目前用於刪除作品；危險動作一律走這裡，不用瀏覽器原生 confirm。
export default function ConfirmDialog({
  title,
  message,
  confirmText = '刪除',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onCancel}>
      <div
        className="w-[360px] rounded-xl border border-edge bg-panel p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-danger/15 text-danger">
            <TriangleAlert size={16} />
          </span>
          <div className="font-display text-sm font-bold text-txt">{title}</div>
        </div>
        <p className="mt-3 break-all text-xs leading-relaxed text-txt-sec">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-edge px-3.5 py-1.5 text-xs text-txt-sec transition hover:text-txt"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-danger px-3.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
