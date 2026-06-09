import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Repeat1, FolderOpen, Copy, Volume2, VolumeX } from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'
import { useGen } from '../stores/genStore'

const fmt = (s: number) =>
  Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00'

export default function TransportBar() {
  const current = useGen((s) => s.current)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const loopRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState('0:00 / 0:00')
  const [copied, setCopied] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [loop, setLoop] = useState(false)

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
      waveColor: '#384150',
      progressColor: '#34D399',
      cursorColor: '#e5e7eb',
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
      update()
    })
    ws.on('timeupdate', update)
    ws.on('play', () => setPlaying(true))
    ws.on('pause', () => setPlaying(false))
    ws.on('finish', () => {
      // 單曲循環：聽 BGM 的 loop 接點是否順
      if (loopRef.current) {
        ws.seekTo(0)
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
          {current ? (loop ? '單曲循環中' : current.finalCaption) : '生成後在此播放'}
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
        disabled
        title="M3 開放：在檔案總管開啟所在資料夾"
        className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-txt-dim opacity-50"
      >
        <FolderOpen size={14} /> 打開本地目錄
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
