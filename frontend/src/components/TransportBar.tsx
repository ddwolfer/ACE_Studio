import { useEffect, useRef, useState } from 'react'
import { Play, Pause, FolderOpen, Copy } from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'
import { useGen } from '../stores/genStore'

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export default function TransportBar() {
  const current = useGen((s) => s.current)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState('0:00 / 0:00')
  const [copied, setCopied] = useState(false)

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
      waveColor: '#3a4150',
      progressColor: '#34D399',
      cursorColor: '#A78BFA',
      barWidth: 2,
      barGap: 2,
      url: current.audioUrl,
    })
    wsRef.current = ws
    const update = () => setTime(`${fmt(ws.getCurrentTime())} / ${fmt(ws.getDuration())}`)
    ws.on('ready', update)
    ws.on('timeupdate', update)
    ws.on('play', () => setPlaying(true))
    ws.on('pause', () => setPlaying(false))
    ws.on('finish', () => setPlaying(false))

    return () => {
      ws.destroy()
    }
  }, [current])

  const copyPrompt = () => {
    if (!current) return
    navigator.clipboard.writeText(current.finalCaption)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <footer
      className="flex items-center gap-4 border-t border-edge bg-panel px-5"
      style={{ height: 64 }}
    >
      <button
        onClick={() => wsRef.current?.playPause()}
        disabled={!current}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-input text-txt disabled:opacity-40"
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <div className="w-40 truncate text-sm text-txt">{current?.title ?? '尚無播放'}</div>
      <div ref={containerRef} className="min-w-0 flex-1" />
      <div className="w-24 text-right font-mono text-xs text-txt-sec">{time}</div>
      <button
        disabled
        title="M3 開放：在檔案總管開啟所在資料夾"
        className="flex items-center gap-1.5 rounded-md bg-input px-3 py-1.5 text-xs text-txt-dim opacity-50"
      >
        <FolderOpen size={14} /> 打開本地目錄
      </button>
      <button
        onClick={copyPrompt}
        disabled={!current}
        className="flex items-center gap-1.5 rounded-md border border-edge px-3 py-1.5 text-xs text-txt-sec hover:text-txt disabled:opacity-40"
      >
        <Copy size={14} /> {copied ? '已複製' : '複製 prompt'}
      </button>
    </footer>
  )
}
