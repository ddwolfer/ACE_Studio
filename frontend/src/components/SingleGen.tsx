import { useEffect, useState } from 'react'
import { Music, Volume2 } from 'lucide-react'
import { useGen } from '../stores/genStore'
import { useService } from '../stores/serviceStore'
import { useQueue } from '../stores/queueStore'
import { composeCaption } from '../lib/promptCompose'

// 可手動輸入的秒數欄：打字期間不干涉（不然輸入「12」會在打「1」時就被夾成 5），
// 失焦 / Enter 才夾回 min–max 並對齊 step
function DurationInput({
  value,
  min,
  max,
  step,
  onCommit,
}: {
  value: number
  min: number
  max: number
  step: number
  onCommit: (v: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft === null) return
    let n = Number(draft)
    if (!Number.isFinite(n)) n = value
    n = Math.min(max, Math.max(min, n))
    n = Number((Math.round(n / step) * step).toFixed(1)) // 對齊步進，順便去浮點殘渣
    onCommit(n)
    setDraft(null)
  }

  return (
    <span className="flex items-center gap-1 font-mono text-primary">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft ?? value}
        onFocus={(e) => {
          setDraft(String(value))
          e.target.select()
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') setDraft(null)
        }}
        title={`可直接輸入 ${min}–${max} 秒`}
        className="w-14 rounded border border-transparent bg-transparent text-right outline-none transition [appearance:textfield] hover:border-edge focus:border-primary focus:bg-input [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      秒
    </span>
  )
}

export default function SingleGen() {
  const g = useGen()
  const ready = useService((s) => s.ready)
  const sfxOk = useService((s) => s.sfxOk)
  const checkSfx = useService((s) => s.checkSfx)
  const enqueue = useQueue((s) => s.enqueue)
  const final = composeCaption(g.base, g.extra)
  const isSfx = g.genType === 'sfx'
  const engineReady = isSfx ? sfxOk : ready
  const canGen = engineReady && !!g.base.trim()

  // 切到 SFX 分頁時重新偵測引擎（run-sfx 可能剛啟動）
  useEffect(() => {
    if (isSfx) void checkSfx()
  }, [isSfx, checkSfx])

  const switchType = (t: 'bgm' | 'sfx') => {
    if (t === g.genType) return
    g.setGenType(t)
    // 長度範圍不同：SFX 0.5–8s，BGM 5–120s → 切換時夾回合理值
    if (t === 'sfx' && g.params.duration > 8) g.setParam('duration', 1.5)
    if (t === 'bgm' && g.params.duration < 5) g.setParam('duration', 60)
    // 切回 BGM → 釋放 SFX 模型還 VRAM（8GB 卡雙引擎共存策略；下次生成 SFX 會自動重載）
    if (t === 'bgm') void fetch('/sfx/release', { method: 'POST' }).catch(() => {})
  }

  const onGenerate = () => {
    if (!canGen) return
    const label = final.split(',')[0].trim().slice(0, 18) || (isSfx ? 'SFX' : 'BGM')
    enqueue(
      {
        type: g.genType,
        base: g.base,
        extra: g.extra,
        instrumental: g.instrumental,
        lyrics: g.lyrics,
        // model 以頂欄目前選擇為準（避免切模型後仍送舊值）
        params: { ...g.params, model: useService.getState().model },
        autoTrim: g.autoTrim,
        trimThresh: g.trimThresh,
      },
      label,
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 類型切換：BGM（ACE-Step）/ SFX（Stable Audio Open） */}
      <div className="flex rounded-lg border border-edge bg-base p-1">
        <button
          onClick={() => switchType('bgm')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition ${
            !isSfx ? 'bg-input text-primary' : 'text-txt-sec hover:text-txt'
          }`}
        >
          <Music size={13} /> BGM 音樂
        </button>
        <button
          onClick={() => switchType('sfx')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition ${
            isSfx ? 'bg-input text-primary' : 'text-txt-sec hover:text-txt'
          }`}
        >
          <Volume2 size={13} /> SFX 音效
        </button>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-txt-sec">
          {isSfx ? '音效描述（描述聲音事件，非音樂風格）' : '曲風描述 (Caption)'}
        </label>
        <textarea
          value={g.base}
          onChange={(e) => g.setBase(e.target.value)}
          rows={3}
          placeholder={
            isSfx ? '例：coin pickup, bright metallic ding, short' : '例：epic orchestral battle, war drums, 140 BPM'
          }
          className="w-full resize-none rounded-md border border-edge bg-input p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-txt-sec">額外 prompt（選填）</label>
        <input
          value={g.extra}
          onChange={(e) => g.setExtra(e.target.value)}
          placeholder={isSfx ? '例：no reverb, clean' : '例：lots of reverb, wide stereo'}
          className="w-full rounded-md border border-edge bg-input p-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {!isSfx && (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={g.instrumental} onChange={(e) => g.setInstrumental(e.target.checked)} className="accent-primary" />
          純音樂 (Instrumental)
        </label>
      )}

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" checked={g.autoTrim} onChange={(e) => g.setAutoTrim(e.target.checked)} className="accent-primary" />
        <span>
          自動裁頭尾空白 <span className="text-xs text-txt-dim">(loop-ready，需 run-local)</span>
        </span>
      </label>

      {!isSfx && (
        <div className={g.instrumental ? 'opacity-40' : ''}>
          <label className="mb-2 block text-xs font-medium text-txt-sec">歌詞 (Lyrics)</label>
          <textarea
            value={g.instrumental ? '[Instrumental]' : g.lyrics}
            disabled={g.instrumental}
            onChange={(e) => g.setLyrics(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-edge bg-input p-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-txt-sec">{isSfx ? '長度（0.5–8 秒）' : '長度（5–120 秒）'}</span>
          <DurationInput
            value={g.params.duration}
            min={isSfx ? 0.5 : 5}
            max={isSfx ? 8 : 120}
            step={isSfx ? 0.5 : 1}
            onCommit={(v) => g.setParam('duration', v)}
          />
        </div>
        <input
          type="range"
          min={isSfx ? 0.5 : 5}
          max={isSfx ? 8 : 120}
          step={isSfx ? 0.5 : 1}
          value={g.params.duration}
          onChange={(e) => g.setParam('duration', Number(e.target.value))}
          className="range w-full"
        />
      </div>

      <div className="rounded-md border border-edge bg-base p-3 text-xs">
        <span className="text-txt-dim">最終 prompt：</span>
        <span className="font-mono text-txt">{final || '（空）'}</span>
      </div>

      <button
        onClick={onGenerate}
        disabled={!canGen}
        className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-[#14110E] transition hover:brightness-105 active:scale-[.99] disabled:opacity-40"
      >
        <Music size={18} />
        {engineReady ? (isSfx ? '生成音效' : '生成音樂') : isSfx ? 'SFX 引擎未啟動' : '請先初始化服務'}
      </button>
      <p className="-mt-2 text-center text-[11px] text-txt-dim">
        {isSfx && !sfxOk
          ? '先執行 setup-sfx.ps1（一次）與 run-sfx.ps1，詳見 engine-sfx/README.md'
          : '按一下加入佇列，可連續排多首'}
      </p>
      {/* Stability 社群授權要求的標註（<$1M 商用免費，需註冊 stability.ai/license） */}
      {isSfx && (
        <p className="-mt-2 text-center text-[10px] text-txt-dim">
          SFX{' '}
          <a
            href="https://stability.ai"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-edge underline-offset-2 transition hover:text-txt-sec"
          >
            Powered by Stability AI
          </a>
        </p>
      )}
    </div>
  )
}
