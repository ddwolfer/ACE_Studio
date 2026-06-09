export interface GenParams {
  model: string
  duration: number
  steps: number
  cfg: number
  inferMethod: 'ode' | 'sde'
  seed: number
  useRandomSeed: boolean
  format: 'wav' | 'mp3' | 'flac'
}

export interface LibraryItem {
  id: string
  title: string
  /** 兩段合成後實際送進模型的 caption（= 複製 prompt 的內容） */
  finalCaption: string
  base: string
  extra: string
  lyrics: string
  params: GenParams
  /** 引擎回傳的本機真實路徑（M3「打開本地目錄」用） */
  audioPath: string
  /** 經 proxy 的播放 URL */
  audioUrl: string
  durationSec: number
  type: 'bgm' | 'sfx'
  createdAt: string
}
