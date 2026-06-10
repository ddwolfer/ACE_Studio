import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Repeat1, FolderOpen, Copy, Volume2, VolumeX } from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'
import { useGen } from '../stores/genStore'
import { local } from '../lib/localHelper'

const fmt = (s: number) =>
  Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00'

// 找出實際有聲音的區間（略過頭尾靜音），讓循環無縫
function findLoopRegion(buf: AudioBuffer, thresh = 0.006): { start: number; end: number } {
  const len = buf.length
  const sr = buf.sampleRate
  const ch = buf.numberOfChannels
  const chans: Float32Array[] = []
  for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c))
  const amp = (i: number) => {
    let m = 0
    for (let c = 0; c < ch; c++) {
      const v = Math.abs(chans[c][i])
      if (v > m) m = v
    }
    return m
  }
  let s = 0
  for (let i = 0; i < len; i++) {
    if (amp(i) > thresh) {
      s = i
      break
    }
  }
  let e = len - 1
  for (let i = len - 1; i >= 0; i--) {
    if (amp(i) > thresh) {
      e = i
      break
    }
  }
  return { start: Math.max(0, s / sr - 0.02), end: Math.min(len / sr, e / sr + 0.04) }
}

export default function TransportBar() {
  const current = useGen((s) => s.current)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const loopRef = useRef(false)
  const loopStartRef = useRef(0)
  const loopEndRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState('0:00 / 0:00')
  const [copied, setCopied] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [loop, setLoop] = useState(false)
  const [folderErr, setFolderErr] = useState(false)
  const [loopRegion, setLoopRegion] = useState<{ start: number; end: number } | null>(null)

  useEffect(() => {
    loopRef.current = loop
  }, [loop])

  useEffect(() => {
    if (!containerRef.current) return
    wsRef.current?.destroy()
    wsRef.current = null
    setPlaying(false)
    setTime('0:00 / 0:00')
    if (!current) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 40,
      waveColor: '#3A332B',
      progressColor: '#E8A24C',
      cursorColor: '#ECE6DD',
      cursorWidth: 1,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      url: current.audioUrl,
    })
    wsRef.current = ws
    const update = () => setTime(`${fmt(ws.getCurrentTime())} / ${fmt(ws.getDuration())}`)
    ws.on('ready', () => {
      ws.setVolume(volume)
      const data = ws.getDecodedData()
      const dur = ws.getDuration()
      if (data) {
        const r = findLoopRegion(data)
        loopStartRef.current = r.start
        loopEndRef.current = r.end
        // 只有頭尾確實有可觀的空白才提示/啟用裁切
        setLoopRegion(r.start > 0.05 || r.end < dur - 0.08 ? r : null)
      } else {
        loopStartRef.current = 0
        loopEndRef.current = dur
        setLoopRegion(null)
      }
      update()
    })
    ws.on('timeupdate', () => {
      update()
      // 單曲循環：到「聲音結束點」就跳回「聲音起始點」，略過尾巴空白 → 無縫
      if (loopRef.current && loopEndRef.current > 0 && ws.getCurrentTime() >= loopEndRef.current) {
        ws.setTime(loopStartRef.current)
      }
    })
    ws.on('play', () => setPlaying(true))
    ws.on('pause', () => setPlaying(false))
    ws.on('finish', () => {
      if (loopRef.current) {
        ws.setTime(loopStartRef.current)
        ws.play()
      } else {
        setPlaying(false)
      }
    })
    return () => {
      ws.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  useEffect(() => {
    wsRef.current?.setVolume(volume)
  }, [volume])

  const copyPrompt = () => {
    if (!current) return
    navigator.clipboard.writeText(current.finalCaption)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // 透過本機小幫手在檔案總管開啟（需 run-local 服務）
  const openFolder = async () => {
    if (!current) return
    try {
      const r = await local.openFolder(current.audioPath)
      if (!r?.ok) throw new Error()
      setFolderErr(false)
    } catch {
      setFolderErr(true)
      setTimeout(() => setFolderErr(false), 2800)
    }
  }

  return (
    <footer
      className="fade-up flex items-center gap-3 border-t border-edge bg-panel/90 px-5 backdrop-blur"
      style={{ height: 66, animationDelay: '0.2s' }}
    >
      <button
        onClick={() => wsRef.current?.playPause()}
        disabled={!current}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-[#0E1014] transition hover:brightness-110 active:scale-95 disabled:bg-input disabled:text-txt-dim"
      >
        {playing ? <Pause size={18} /> : <Play size={18} className="translate-x-px" />}
      </button>

      <button
        onClick={() => setLoop((v) => !v)}
        disabled={!current}
        title="單曲循環（試聽 BGM loop 接點）"
        className={`flex h-9 w-9 items-center justify-center rounded-full transition disabled:opacity-40 ${
          loop ? 'bg-primary/15 text-primary' : 'text-txt-sec hover:text-txt'
        }`}
      >
        <Repeat1 size={17} />
      </button>

      <div className="ml-1 w-44 shrink-0">
        <div className="truncate text-sm font-medium text-txt">{current?.title ?? '尚無播放'}</div>
        <div className="truncate text-[11px] text-txt-dim">
          {current
            ? loop
              ? loopRegion
                ? `單曲循環 · 已略過頭尾空白（${fmt(loopRegion.start)}–${fmt(loopRegion.end)}）`
                : '單曲循環中'
              : current.finalCaption
            : '生成後在此播放'}
        </div>
      </div>

      <div ref={containerRef} className="min-w-0 flex-1" />

      <div className="w-[88px] shrink-0 text-right font-mono text-xs text-txt-sec">{time}</div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => setVolume((v) => (v > 0 ? 0 : 0.8))}
          className="text-txt-sec transition hover:text-txt"
          title="靜音 / 取消靜音"
        >
          {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <input
          type="range"
          className="range w-24"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          title={`音量 ${Math.round(volume * 100)}%`}
        />
      </div>

      <button
        onClick={openFolder}
        disabled={!current}
        title="在檔案總管開啟所在資料夾（需先啟動 run-local 本機服務）"
        className="flex shrink-0 items-center gap-1.5 rounded-md border border-edge px-3 py-1.5 text-xs text-txt-sec transition hover:text-txt disabled:opacity-40"
      >
        <FolderOpen size={14} /> {folderErr ? '需啟動 run-local' : '打開本地目錄'}
      </button>
      <button
        onClick={copyPrompt}
        disabled={!current}
        className="flex shrink-0 items-center gap-1.5 rounded-md border border-edge px-3 py-1.5 text-xs text-txt-sec transition hover:text-txt disabled:opacity-40"
      >
        <Copy size={14} /> {copied ? '已複製' : '複製 prompt'}
      </button>
    </footer>
  )
}
