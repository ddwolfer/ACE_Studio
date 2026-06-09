import type { CSSProperties } from 'react'

// 由 seed（音檔 id）決定的「封面色」——讓音檔庫像真正的音樂庫，色彩由內容提供。
export function coverStyle(seed: string): CSSProperties {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const a = (h >>> 0) % 360
  const b = (a + 35 + ((h >>> 9) % 70)) % 360
  return {
    background: `linear-gradient(140deg, hsl(${a} 52% 44%), hsl(${b} 46% 20%))`,
  }
}
